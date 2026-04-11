/*
 * File: request.ts
 * Project: fluxer-vscode
 * Created Date: 2026-04-10 20:48:15
 * Author: 3urobeat
 *
 * Last Modified: 2026-04-11 17:38:56
 * Modified By: 3urobeat
 *
 * Copyright (c) 2026 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


import * as vscode from "vscode";
import https from "https";
import { IncomingMessage } from "http";
import { CustomStatusPayload } from "./model";
import { getExtensionConfiguration } from "./config";
import { getActivityText } from "./activity";


/**
 * Handles interfacing with Fluxer API
 */

let lastStatusText: string;
let lastUpdateTimestamp: number;

const apiUrl = new URL("https://web.fluxer.app/api/v1/users/@me/settings");


/**
 * Sends an API request
 * @param authToken Fluxer auth token to supply
 * @param payload JSON payload to send in request
 * @returns Returns Promise that resolves when the request finishes
 */
async function sendApiRequest(authToken: string, payload: object) {
    return new Promise<void>((resolve, reject) => {

        // Encode payload data
        const encodedPayload = JSON.stringify(payload);

        // Specify request options
        const options = {
            host: apiUrl.host,      // Hostname + Port
            path: apiUrl.pathname,
            method: "PATCH",
            headers: {
                "Accept": "*/*",
                "Authorization": authToken,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(encodedPayload),
                "Origin": "https://web.fluxer.app"
            },
            timeout: 10000
        };

        console.debug("Sending request with payload:", payload);

        // Register request handler
        const req = https.request(options, (res: IncomingMessage) => {
            let output = "";

            res.on("data", (chunk) => {
                output += chunk;
            });

            res.on("end", () => {
                console.debug(`Request Response (${res.statusCode}): `, output);

                if (res.statusCode !== 200) { // TODO: Can a success be something else than 200?
                    return reject(new Error(`API Error (${res.statusCode}): ${output}`));
                }

                resolve();
            });
        });

        req.on("error", (err) => {
            reject(err);
        });

        req.on("timeout", () => {
            reject(new Error("Request timed out"));
        });

        // Write payload data
        req.write(encodedPayload);
        req.end();

    });
}


/**
 * Sends presence update to Fluxer API
 * @throws Throws Error on failure
 * @param activityText Activity text to send
 */
export async function sendPresenceUpdate(activityText: string) {

    // Construct presence data to send
    const statusData: CustomStatusPayload = {
        text: activityText,
        expires_at: new Date(Date.now() + getExtensionConfiguration().statusUntil).toISOString() // eslint-disable-line camelcase
    };

    const token = getExtensionConfiguration().token;

    try {
        await sendApiRequest(token, { "custom_status": statusData });
        console.debug("Successfully sent status update to Fluxer API!");

    } catch (error) {

        console.error("Failed to send status update to Fluxer:", error);
        vscode.window.showErrorMessage("Failed to send status update to Fluxer API: " + error);
        throw error; // Rethrow
    }

}


/**
 * Updates Fluxer presence with current activity if necessary
 * @throws Throws exception when presence send request failed
 * @param force Optional: Force update now
 * @returns Returns Promise resolving when done
 */
export async function updatePresence(force?: boolean): Promise<unknown> {

    // Get current activity
    const activityText = await getActivityText();

    // Defer update if last sent activity matches current and an update has been sent in the last statusUntil ms
    if (!force
        && activityText === lastStatusText
        && lastUpdateTimestamp
        && lastUpdateTimestamp + getExtensionConfiguration().statusUntil > Date.now()) {
        console.debug("Current presence matches last sent status, avoiding update...");
        return;
    }

    console.log(`New activity detected, updating status from '${lastStatusText}' to '${activityText}'...`);

    // Send request
    await sendPresenceUpdate(activityText);
    lastStatusText = activityText;
    lastUpdateTimestamp = Date.now();

}

/*
 * File: extension.ts
 * Project: fluxer-vscode
 * Created Date: 2026-04-10 16:26:18
 * Author: 3urobeat
 *
 * Last Modified: 2026-04-11 17:26:49
 * Modified By: 3urobeat
 *
 * Copyright (c) 2026 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// VS Code extensibility API
import * as vscode from "vscode";

import { updatePresence } from "./request";
import { getActivityText } from "./activity";
import { getExtensionConfiguration, isTokenSet } from "./config";


/**
 * VsCode/ium extension main file
 */


let lastStatusText: string;
let lastUpdateTimestamp: number;
let statusUpdateHandler: NodeJS.Timeout | undefined;


/**
 * Registers VsCode/ium extension commands
 * @param context
 */
function registerCommands(context: vscode.ExtensionContext) {

    console.debug("Registering commands...");

    // Register 'update-presence' command specified in package.json
    const disposable = vscode.commands.registerCommand("fluxer-vscode.update-presence", async () => {
        if (!isTokenSet()) {
            return;
        }

        vscode.window.showInformationMessage("Updating status now...");

        const activityText = await getActivityText();
        updatePresence(activityText) // Let exception fall through to extension host
            .then(() => {
                lastStatusText = activityText;
            });

        vscode.window.showInformationMessage("Successfully sent status update to Fluxer!");
    });

    context.subscriptions.push(disposable);

}


/**
 * Called when extension is activated
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {

    // Check if extension is disabled in our settings
    if (!getExtensionConfiguration().enable) {
        console.debug("Extension got activated but is disabled in settings, ignoring...");
        return;
    }

    console.log("Extension activated!");

    // Register commands
    registerCommands(context);

    // Check if token is set
    if (!isTokenSet()) {
        return;
    }

    // Register periodic update interval (if enabled)
    if (!statusUpdateHandler) {
        if (getExtensionConfiguration().updateCheckInterval > 0) {
            statusUpdateHandler = setInterval(async () => {

                // Get current activity
                const activityText = await getActivityText();

                // Defer update if last sent activity matches current and an update has been sent in the last statusUntil ms
                if (activityText === lastStatusText
                    && lastUpdateTimestamp
                    && lastUpdateTimestamp + getExtensionConfiguration().statusUntil > Date.now()) {
                    console.debug("Current presence matches last sent status, avoiding update...");
                    return;
                }

                console.log(`New activity detected, updating status from '${lastStatusText}' to '${activityText}'...`);

                // Send request
                updatePresence(activityText)
                    .then(() => {
                        lastStatusText = activityText;
                        lastUpdateTimestamp = Date.now();
                    })
                    .catch(() => {}); // Exception is already handled by child

            }, getExtensionConfiguration().updateCheckInterval);

            console.debug(`Registered status update handler which runs every ${getExtensionConfiguration().updateCheckInterval}ms`);
        } else {
            console.debug("statusUpdateHandler is disabled in settings, ignoring...");
        }
    }

}


/**
 * Called when extension is activated
 */
export async function deactivate() {

    // Clear status and reset tracking variables. Ignore errors because whatyagonnadonow
    try {
        await updatePresence("");
        lastStatusText = "";
        lastUpdateTimestamp = 0;
    } catch(err) {} // eslint-disable-line

    // Disable periodic check interval
    if (statusUpdateHandler) {
        statusUpdateHandler.close();
        statusUpdateHandler = undefined;
        console.debug("Unregistered status update handler");
    }

    console.log("Extension deactivated");

}

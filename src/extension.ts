/*
 * File: extension.ts
 * Project: fluxer-vscode
 * Created Date: 2026-04-10 16:26:18
 * Author: 3urobeat
 *
 * Last Modified: 2026-04-11 00:38:17
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


/**
 * VsCode/ium extension main file
 */


const statusUpdateInterval: number = 10000;

let lastStatusText: string;
let statusUpdateHandler: NodeJS.Timeout | undefined;


/**
 * Registers VsCode/ium extension commands
 * @param context
 */
function registerCommands(context: vscode.ExtensionContext) {

    console.debug("Registering commands...");

    // Register 'update-presence' command specified in package.json
    const disposable = vscode.commands.registerCommand("fluxer-vscode.update-presence", async () => {

        vscode.window.showInformationMessage("Updating status now...");

        const activityText = await getActivityText();
        updatePresence(activityText); // Let exception fall through to extension host

        vscode.window.showInformationMessage("Successfully sent status update to Fluxer!");

    });

    context.subscriptions.push(disposable);

}


/**
 * Called when extension is activated
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {

    console.log("Extension activated!");

    // Register commands
    registerCommands(context);

    // Register periodic update interval
    if (!statusUpdateHandler) {
        statusUpdateHandler = setInterval(async () => {

            const activityText = await getActivityText();

            if (activityText === lastStatusText) {
                console.debug("Current presence matches last sent status, avoiding update...");
                return;
            }

            console.log(`New activity detected, updating status from '${lastStatusText}' to '${activityText}'...`);

            updatePresence(activityText)
                .then(() => {
                    lastStatusText = activityText;
                })
                .catch(() => {}); // Exception is already handled by child

        }, statusUpdateInterval);

        console.debug(`Registered status update handler which runs every ${statusUpdateInterval}ms`);
    }

}


/**
 * Called when extension is activated
 */
export function deactivate() {

    // TODO: Clear status

    // Disable periodic check interval
    if (statusUpdateHandler) {
        statusUpdateHandler.close();
        statusUpdateHandler = undefined;
        console.debug("Unregistered status update handler");
    }

    console.log("Extension deactivated");

}

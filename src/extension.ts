/*
 * File: extension.ts
 * Project: fluxer-vscode
 * Created Date: 2026-04-10 16:26:18
 * Author: 3urobeat
 *
 * Last Modified: 2026-04-11 19:26:49
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

import { getExtensionConfiguration, isTokenSet } from "./config";
import { getLastStatusText, getLastUpdateTimestamp, sendPresenceUpdate, updatePresence } from "./request";


/**
 * VsCode/ium extension main file
 */


let statusUpdateHandler: NodeJS.Timeout | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;


/**
 * Updates status bar item (if not disabled)
 * @param active Whether connection to Fluxer is established
 */
function updateStatusBarItem(active: boolean) {
    if (statusBarItem) {
        statusBarItem?.show();

        // Set text depending on whether connection is active
        if (active) {
            statusBarItem.text = "$(check) Connected to Fluxer";
        } else {
            statusBarItem.text = "$(close) Disconnected from Fluxer";
        }

        // Set last update time tooltip
        let   lastRefreshText = "never";
        const lastRefresh     = getLastUpdateTimestamp();

        if (lastRefresh) {
            let last = (Date.now() - lastRefresh) / 1000;
            let unit = "seconds ago";

            if (last > 60) {
                last /= 60;
                unit = "minutes ago";
            }

            lastRefreshText = `${Math.round(last)} ${unit}`;
        }

        statusBarItem.tooltip = `Last Status Update: ${lastRefreshText}. Click to update status now.`;
    }
}


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

        // Force update and show status bar text on success
        updatePresence(true)
            .then(()  => {
                updateStatusBarItem(true);
                vscode.window.showInformationMessage("Successfully sent status update to Fluxer!");
            })
            .catch(() => updateStatusBarItem(false)); // Parent already shows error notification, no need to do that here again
    });

    context.subscriptions.push(disposable);
}


/**
 * Initializes the extension
 * @param context
 */
function initializeExtension(context: vscode.ExtensionContext) {
    if (!getExtensionConfiguration().enable) {
        console.debug("Extension is disabled in settings, ignoring...");
        return;
    }

    // Display error notification and abort if no token is set
    if (!isTokenSet()) {
        return;
    }

    // Register statusBar item if none is currently registered
    if (!statusBarItem) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        updateStatusBarItem(false);
        statusBarItem.command = "fluxer-vscode.update-presence";
        context.subscriptions.push(statusBarItem);
    }

    if (!statusUpdateHandler) {
        if (getExtensionConfiguration().updateCheckInterval > 0) {
            statusUpdateHandler = setInterval(async () => {

                updatePresence()
                    .then(()  => updateStatusBarItem(true))
                    .catch(() => updateStatusBarItem(false));

            }, getExtensionConfiguration().updateCheckInterval);

            console.debug(`Registered status update handler which runs every ${getExtensionConfiguration().updateCheckInterval}ms`);
        } else {
            console.debug("statusUpdateHandler is disabled in settings, ignoring...");

            // Send informational notification and provide button to update status once now
            vscode.window.showInformationMessage("Automatic status updates are disabled in settings. To update your status, send the command 'fluxer-vscode.update-presence'.", "Update Status now")
                .then((val) => {
                    if (val === "Update Status now") {
                        vscode.commands.executeCommand("fluxer-vscode.update-presence");
                    }
                });
        }
    }
}


/**
 * Uninitializes the extension
 */
async function uninitializeExtension() {
    // Clear status if we ever sent one. Ignore errors because whatyagonnadonow
    try {
        if (getLastStatusText() !== undefined) {
            await sendPresenceUpdate("");
        }
    } catch(err) {} // eslint-disable-line

    // Disable periodic check interval
    if (statusUpdateHandler) {
        statusUpdateHandler.close();
        statusUpdateHandler = undefined;
        console.debug("Unregistered status update handler");
    }

    // Hide status bar item again
    if (statusBarItem) {
        statusBarItem.hide();
        statusBarItem = undefined;
    }
}


/**
 * Called once when the extension is activated
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
    console.log("Extension activated!");

    // Register commands
    registerCommands(context);

    // Initialize the extension
    initializeExtension(context);

    // Listen for configuration changes and reinitialize the extension
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async (event) => {
            if (event.affectsConfiguration("fluxer")) {
                console.log("Configuration changed, reinitializing extension...");

                await uninitializeExtension();
                initializeExtension(context);
            }
        })
    );
}


/**
 * Called when the extension is deactivated
 */
export async function deactivate() {
    await uninitializeExtension();
    console.log("Extension deactivated");
}

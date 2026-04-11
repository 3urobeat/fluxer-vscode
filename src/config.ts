/*
 * File: config.ts
 * Project: fluxer-vscode
 * Created Date: 2026-04-11 17:26:09
 * Author: 3urobeat
 *
 * Last Modified: 2026-04-11 17:26:43
 * Modified By: 3urobeat
 *
 * Copyright (c) 2026 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


import * as vscode from "vscode";
import { defaultExtensionConfig, ExtensionConfig } from "./model";


/**
 * Gets user configuration of extension
 */
export function getExtensionConfiguration(): ExtensionConfig {
    const curSet: ExtensionConfig = defaultExtensionConfig;

    // Override default values with user settings
    Object.keys(curSet).forEach((key) => {
        const override = vscode.workspace.getConfiguration("fluxer").get(key);

        if (override) {
            (curSet[key as keyof ExtensionConfig] as unknown as keyof ExtensionConfig) = override as unknown as keyof ExtensionConfig;
        } else {
            console.debug(`Key '${key}' is missing from user config, using default`);
        }
    });

    return curSet as unknown as ExtensionConfig;
}


/**
 * Checks whether token is set in settings and displays error notification if not
 * @returns Returns boolean indicating if token is set, execution should stop if `false`
 */
export function isTokenSet(): boolean {
    const token = getExtensionConfiguration().token;
    const isSet = token !== undefined && token.length > 0;

    if (!isSet) {
        console.warn("No Fluxer token set!");

        vscode.window.showErrorMessage("Please configure your Fluxer token in the extension settings!", "Open Settings")
            .then((val) => {
                if (val === "Open Settings") {
                    vscode.commands.executeCommand("workbench.action.openSettings", "fluxer"); // Release: @ext:3urobeat.fluxer-vscode
                }
            });
    }

    return isSet;
}

/*
 * File: activity.ts
 * Project: fluxer-vscode
 * Created Date: 2026-04-10 20:49:14
 * Author: 3urobeat
 *
 * Last Modified: 2026-04-11 17:27:03
 * Modified By: 3urobeat
 *
 * Copyright (c) 2026 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


import { window, workspace } from "vscode";
import { basename } from "path";
import { getExtensionConfiguration } from "./config";


/**
 * Handles getting VsCode/ium activity
 */

const idleText = "Idling";


/**
 * Gets currently loaded workspace or directory name
 * @returns Returns Promise that resolves to workspace name or `undefined` if no text editor is currently active
 */
async function getWorkspaceName(): Promise<string | undefined> {
    if (window.activeTextEditor) {
        const workspaceName = workspace.getWorkspaceFolder(window.activeTextEditor.document.uri); // Returns !undefined if a folder or workspace is currently opened

        return workspaceName ? workspaceName.name : undefined;
    }

    return undefined;
}


/**
 * Gets currently opened file name
 * @returns Returns Promise that resolves to file name or `undefined` if no text editor is currently active
 */
async function getCurrentFileName(): Promise<string | undefined> {
    if (window.activeTextEditor) {
        const docUri = window.activeTextEditor.document.uri;

        return basename(docUri.path);
    }

    return undefined;
}


/**
 * Cuts long activity name
 * @param str String to trim
 * @returns Returns trimmed `str`
 */
function sliceActivity(str?: string | undefined): string | undefined {
    if (str && str.length > 19) { // 16 + 3 dots
        return str.slice(0, 16) + "...";
    }

    return str;
}


/**
 * Gets formatted VsCode/ium activity text
 */
export async function getActivityText(): Promise<string> {

    // Get active workspace with activeFile fallback
    const activeWorkspace = sliceActivity(await getWorkspaceName());
    const activeFile      = activeWorkspace ? undefined : sliceActivity(await getCurrentFileName());

    // Construct activityText string
    let activity;
    if (activeWorkspace) {
        activity = `Editing project '${activeWorkspace}'`;
    } else if (activeFile) {
        activity = `Editing file '${activeFile}'`;
    } else if (getExtensionConfiguration().status.showIdle) {
        activity = idleText;
    }
    let activityText;
    if (activity) {
        activityText = getExtensionConfiguration().status.activityText
            .replace("{activity}", activity);
    }

    // Construct final string
    const appName = getExtensionConfiguration().status.appName;

    return getExtensionConfiguration().status.format
        .replace("{appName}", appName)
        .replace("{activityText}", activityText || "");

}

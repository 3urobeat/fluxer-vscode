/*
 * File: model.ts
 * Project: fluxer-vscode
 * Created Date: 2026-04-10 20:48:24
 * Author: 3urobeat
 *
 * Last Modified: 2026-04-11 21:16:50
 * Modified By: 3urobeat
 *
 * Copyright (c) 2026 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


import packageJson from "../package.json";


/**
 * Contains type definitions
 */


const configProps = packageJson.contributes.configuration.properties;


// Helper type to get all values from object mapping (basically valueof)
export type LeafStrings<T> =
  T extends string ? T :
  T extends readonly unknown[] ? LeafStrings<T[number]> :
  T extends object ? LeafStrings<T[keyof T]> :
  never;


// Data expected in status api request
export interface CustomStatusPayload {
    text:       string,
    expires_at: string // ISO stringified Timestamp
}


// Configuration properties from package.json
export interface ExtensionConfig {
    enable:           boolean,
    updateCheckInterval: number,
    statusUntil:      number,
    token:            string,
    status: {
        format:       string,
        activityText: string,
        appName:      string,
        showIdle:     boolean,
        clearIdleAfter: number
    }
}

// Maps ExtensionConfig type to representation in package.sjon
export const ExtensionConfigMap = {
    enable:           "fluxer.enable",
    updateCheckInterval: "fluxer.updateCheckInterval",
    statusUntil:      "fluxer.statusUntil",
    token:            "fluxer.token",
    status: {
        activityText: "fluxer.status.activityText",
        format:       "fluxer.status.format",
        appName:      "fluxer.status.appName",
        showIdle:     "fluxer.status.showIdle",
        clearIdleAfter: "fluxer.status.clearIdleAfter"
    }
} as const;

export type ExtensionConfigMapVal = LeafStrings<typeof ExtensionConfigMap>;

// Default configuration values from package.json
export const defaultExtensionConfig: ExtensionConfig = {
    enable:           configProps[ExtensionConfigMap.enable].default,
    updateCheckInterval: configProps[ExtensionConfigMap.updateCheckInterval].default,
    statusUntil:      configProps[ExtensionConfigMap.statusUntil].default,
    token:            configProps[ExtensionConfigMap.token].default,
    status: {
        activityText: configProps[ExtensionConfigMap.status.activityText].default,
        format:       configProps[ExtensionConfigMap.status.format].default,
        appName:      configProps[ExtensionConfigMap.status.appName].default,
        showIdle:     configProps[ExtensionConfigMap.status.showIdle].default,
        clearIdleAfter: configProps[ExtensionConfigMap.status.clearIdleAfter].default
    }
};

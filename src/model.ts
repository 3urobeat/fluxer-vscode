/*
 * File: model.ts
 * Project: fluxer-vscode
 * Created Date: 2026-04-10 20:48:24
 * Author: 3urobeat
 *
 * Last Modified: 2026-04-10 21:02:22
 * Modified By: 3urobeat
 *
 * Copyright (c) 2026 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/**
 * Contains type definitions
 */


// Data expected in status api request
export interface CustomStatusPayload {
    text: string,
    expires_at: string // ISO stringified Timestamp
}

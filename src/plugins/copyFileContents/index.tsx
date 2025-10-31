/*
 * Velocity, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./style.css";

import ErrorBoundary from "@components/ErrorBoundary";
import { CopyIcon, NoEntrySignIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import { copyWithToast } from "@utils/misc";
import definePlugin from "@utils/types";
import { Tooltip, useState } from "@webpack/common";

const CheckMarkIcon = () => {
    return <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="currentColor" d="M21.7 5.3a1 1 0 0 1 0 1.4l-12 12a1 1 0 0 1-1.4 0l-6-6a1 1 0 1 1 1.4-1.4L9 16.58l11.3-11.3a1 1 0 0 1 1.4 0Z"></path>
    </svg>;
};

export default definePlugin({
    name: "CopyFileContents",
    description: "Adds a button to text file attachments to copy their contents",
    authors: [Devs.Obsidian, Devs.Nuckyz],
    patches: [
        {
            find: "#{intl::PREVIEW_BYTES_LEFT}",
            replacement: {
                match: /\.footerGap.+?url:\i,fileName:\i,fileSize:\i}\),(?<=fileContents:(\i),bytesLeft:(\i).+?)/g,
                replace: "$&$self.addCopyButton({fileContents:$1,bytesLeft:$2}),"
            }
        }
    ],

    addCopyButton: ErrorBoundary.wrap(({ fileContents, bytesLeft }: { fileContents: string, bytesLeft: number; }) => {
        const [recentlyCopied, setRecentlyCopied] = useState(false);

        return (
            <Tooltip text={recentlyCopied ? "Copied!" : bytesLeft > 0 ? "File too large to copy" : "Copy File Contents"}>
                {tooltipProps => (
                    <div
                        {...tooltipProps}
                        className="vc-cfc-button"
                        role="button"
                        onClick={() => {
                            if (!recentlyCopied && bytesLeft <= 0) {
                                copyWithToast(fileContents);
                                setRecentlyCopied(true);
                                setTimeout(() => setRecentlyCopied(false), 2000);
                            }
                        }}
                    >
                        {recentlyCopied ? <CheckMarkIcon /> : bytesLeft > 0 ? <NoEntrySignIcon color="var(--channel-icon)" /> : <CopyIcon />}
                    </div>
                )}
            </Tooltip>
        );
    }, { noop: true }),
});

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

import ErrorBoundary from "@components/ErrorBoundary";
import { isPrimitiveReactNode } from "@utils/react";
import { waitFor } from "@webpack";
import { ReactNode } from "react";

let NoticesModule: any;
waitFor(m => m.show && m.dismiss && !m.suppressAll, m => NoticesModule = m);

export const noticesQueue = [] as any[];
export let currentNotice: any = null;

export type types =
    | "DOWNLOAD_NAG"
    | "CONNECT_SPOTIFY"
    | "CONNECT_PLAYSTATION"
    | "PASSKEY_BACKUP"
    | "PREMIUM_TIER_2_TRIAL_ENDING"
    | "PREMIUM_REACTIVATE"
    | "BOUNCED_EMAIL_DETECTED"
    | "ACTIVATE_SERVER_SUBSCRIPTION"
    | "PREMIUM_TIER_0_TRIAL_ENDING"
    | "POMELO_ELIGIBLE"
    | "CHECKOUT_RECOVERY_NAGBAR"
    | "REPORT_TO_MOD_EXIT_SURVEY"
    | "GIFTING_PROMOTION_REMINDER"
    | "PREMIUM_TIER_2_DISCOUNT_ENDING"
    | "OUTBOUND_PROMOTION"
    | "DETECTED_OFF_PLATFORM_PREMIUM_PERK_UPSELL"
    | "PREMIUM_UNCANCEL"
    | "PREMIUM_MISSING_PAYMENT"
    | "PREMIUM_PAST_DUE_MISSING_PAYMENT"
    | "PREMIUM_PAST_DUE_INVALID_PAYMENT"
    | "PREMIUM_PAST_DUE_ONE_TIME_PAYMENT"
    | "AUTO_MODERATION_MENTION_RAID_DETECTION"
    | "GUILD_RAID_NOTIFICATION"
    | "WIN32_DEPRECATED_MESSAGE"
    | "WIN7_8_DEPRECATED_MESSAGE"
    | "BLOCK_USER_FEEDBACK_NAGBAR"
    | "MACOS_19_DEPRECATED_MESSAGE"
    | "SYSTEM_SERVICE_WARNING"
    | "NO_INPUT_DETECTED"
    | "NO_INPUT_DEVICES_DETECTED"
    | "STREAMER_MODE"
    | "VIDEO_UNSUPPORTED_BROWSER"
    | "SPOTIFY_AUTO_PAUSED"
    | "DISPATCH_ERROR"
    | "DISPATCH_INSTALL_SCRIPT_PROGRESS"
    | "BLOCKED_BY_PROXY"
    | "GENERIC";

interface Notice {
    message: ReactNode;
    buttonText: string;
    onClick: () => void;
    type?: types | "GENERIC";
}

export function popNotice() {
    NoticesModule.dismiss();
}

export function nextNotice() {
    currentNotice = noticesQueue.shift();

    if (currentNotice) {
        NoticesModule.show(...currentNotice, "VelocityNotice");
    }
}

export function showNotice(notice: Notice) {
    const message = isPrimitiveReactNode(notice.message)
        ? notice.message
        : (
            <ErrorBoundary fallback={() => "Error Showing Notice"}>
                {notice.message}
            </ErrorBoundary>
        );

    noticesQueue.push([notice.type ?? "GENERIC", message, notice.buttonText, notice.onClick]);
    if (!currentNotice) nextNotice();
}

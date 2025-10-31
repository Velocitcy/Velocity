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

import { DataStore } from "@api/index";
import { Logger } from "@utils/Logger";
import { openModal } from "@utils/modal";
import { OAuth2AuthorizeModal, showToast, Toasts, UserStore } from "@webpack/common";

import { ReviewDBAuth } from "./entities";

const DATA_STORE_KEY = "rdb-auth";

export let Auth: ReviewDBAuth = {};

export async function initAuth() {
    Auth = await getAuth() ?? {};
}

export async function getAuth(): Promise<ReviewDBAuth | undefined> {
    const auth = await DataStore.get(DATA_STORE_KEY);
    return auth?.[UserStore.getCurrentUser()?.id];
}

export async function getToken() {
    const auth = await getAuth();
    return auth?.token;
}

export async function updateAuth(newAuth: ReviewDBAuth) {
    return DataStore.update(DATA_STORE_KEY, auth => {
        auth ??= {};
        Auth = auth[UserStore.getCurrentUser().id] ??= {};

        if (newAuth.token) Auth.token = newAuth.token;
        if (newAuth.user) Auth.user = newAuth.user;

        return auth;
    });
}

export function authorize(callback?: any) {
    openModal(props =>
        <OAuth2AuthorizeModal
            {...props}
            scopes={["identify"]}
            responseType="code"
            redirectUri="https://manti.vendicated.dev/api/reviewdb/auth"
            permissions={0n}
            clientId="915703782174752809"
            cancelCompletesFlow={false}
            callback={async (response: any) => {
                try {
                    const url = new URL(response.location);
                    url.searchParams.append("clientMod", "Velocity");
                    const res = await fetch(url, {
                        headers: { Accept: "application/json" }
                    });

                    if (!res.ok) {
                        const { message } = await res.json();
                        showToast(message || "An error occured while authorizing", Toasts.Type.FAILURE);
                        return;
                    }

                    const { token } = await res.json();
                    updateAuth({ token });
                    showToast("Successfully logged in!", Toasts.Type.SUCCESS);
                    callback?.();
                } catch (e) {
                    new Logger("ReviewDB").error("Failed to authorize", e);
                }
            }}
        />
    );
}

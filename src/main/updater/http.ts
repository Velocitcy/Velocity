/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { fetchBuffer, fetchJson } from "@main/utils/http";
import { IpcEvents } from "@shared/IpcEvents";
import { VELOCITY_USER_AGENT } from "@shared/velocityUserAgent";
import { ipcMain } from "electron";
import { writeFile } from "fs/promises";
import { join } from "path";

import gitHash from "~git-hash";
import gitRemote from "~git-remote";

import { serializeErrors, VELOCITY_FILES } from "./common";

const API_BASE = `https://api.github.com/repos/${gitRemote}`;
let PendingUpdates: [string, string][] = [];

/**
 * Fetch JSON data from the GitHub API with proper headers.
 */
async function githubGet<T = any>(endpoint: string): Promise<T> {
    return fetchJson<T>(API_BASE + endpoint, {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": VELOCITY_USER_AGENT
        }
    });
}

/**
 * Compare the current local commit with GitHub’s latest.
 */
async function calculateGitChanges() {
    const isOutdated = await fetchUpdates();
    if (!isOutdated) return [];

    const data = await githubGet(`/compare/${gitHash}...HEAD`);

    return data.commits.map((c: any) => ({
        hash: c.sha.slice(0, 7),
        author: c.author.login,
        message: c.commit.message.split("\n")[0]
    }));
}

/**
 * Fetches info about the latest release from GitHub
 * and stores matching downloadable files.
 */
async function fetchUpdates() {
    const data = await githubGet("/releases/latest");

    const latestHash = data.name.slice(data.name.lastIndexOf(" ") + 1);
    if (latestHash === gitHash)
        return false; // Already up to date

    data.assets.forEach(({ name, browser_download_url }: any) => {
        if (VELOCITY_FILES.some(f => name.startsWith(f))) {
            PendingUpdates.push([name, browser_download_url]);
        }
    });

    return true;
}

/**
 * Downloads and applies updates by replacing existing .js files.
 */
async function applyUpdates() {
    const fileContents = await Promise.all(PendingUpdates.map(async ([name, url]) => {
        const contents = await fetchBuffer(url);
        return [join(__dirname, name), contents] as const;
    }));

    await Promise.all(fileContents.map(async ([filename, contents]) => {
        await writeFile(filename, contents);
    }));

    PendingUpdates = [];
    return true;
}

// IPC event bindings
ipcMain.handle(IpcEvents.GET_REPO, serializeErrors(() => `https://github.com/${gitRemote}`));
ipcMain.handle(IpcEvents.GET_UPDATES, serializeErrors(calculateGitChanges));
ipcMain.handle(IpcEvents.UPDATE, serializeErrors(fetchUpdates));
ipcMain.handle(IpcEvents.BUILD, serializeErrors(applyUpdates));

/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings, useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { DeleteIcon, FolderIcon, PaintbrushIcon, PencilIcon, PlusIcon, RestartIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { AddonCard } from "@components/settings/AddonCard";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { UserThemeHeader } from "@main/themes";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { findLazy } from "@webpack";
import { Card, Forms, showToast, Toasts, Tooltip, useEffect, useRef, useState } from "@webpack/common";
import ClientThemePlugin from "plugins/clientTheme";
import type { ComponentType, CSSProperties, Ref, SyntheticEvent } from "react";

const cl = classNameFactory("vc-settings-theme-");

type FileInput = ComponentType<{
    ref: Ref<HTMLInputElement>;
    onChange: (e: SyntheticEvent<HTMLInputElement>) => void;
    multiple?: boolean;
    filters?: { name?: string; extensions: string[]; }[];
}>;

const FileInput: FileInput = findLazy(m => m.prototype?.activateUploadDialogue && m.prototype.setRef);

function onLocalThemeChange(fileName: string, value: boolean) {
    if (value) {
        if (Settings.enabledThemes.includes(fileName)) return;
        Settings.enabledThemes = [...Settings.enabledThemes, fileName];
    } else {
        Settings.enabledThemes = Settings.enabledThemes.filter(f => f !== fileName);
    }
}

async function onFileUpload(e: SyntheticEvent<HTMLInputElement>) {
    e.stopPropagation();
    e.preventDefault();

    if (!e.currentTarget?.files?.length) return;
    const { files } = e.currentTarget;

    const uploads = Array.from(files, file => {
        const { name } = file;
        if (!name.endsWith(".css")) return;

        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                VelocityNative.themes.uploadTheme(name, reader.result as string)
                    .then(resolve)
                    .catch(reject);
            };
            reader.readAsText(file);
        });
    });

    await Promise.all(uploads);
    showToast("Theme(s) uploaded successfully!", Toasts.Type.SUCCESS);
}

const linkContainerStyle: CSSProperties = { marginBottom: ".5em", display: "flex", flexDirection: "column" };
const linkStyle: CSSProperties = { marginRight: ".5em" };
const uploadSpanStyle: CSSProperties = { position: "relative" };

export function LocalThemesTab() {
    const settings = useSettings(["enabledThemes"]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [userThemes, setUserThemes] = useState<UserThemeHeader[] | null>(null);

    useEffect(() => {
        refreshLocalThemes();
    }, []);

    async function refreshLocalThemes() {
        const themes = await VelocityNative.themes.getThemesList();
        setUserThemes(themes);
    }

    const normalThemes = userThemes?.filter(t => !(t as any).required) || [];
    const requiredThemes = userThemes?.filter(t => (t as any).required) || [];

    return (
        <>
            <Card className="vc-settings-card">
                <Forms.FormTitle tag="h5">Find Themes:</Forms.FormTitle>
                <div style={linkContainerStyle}>
                    <Link style={linkStyle} href="https://betterdiscord.app/themes">
                        BetterDiscord Themes
                    </Link>
                    <Link href="https://github.com/search?q=discord+theme">GitHub</Link>
                </div>
                <Forms.FormText>If using the BD site, click on "Download" and place the downloaded .theme.css file into your themes folder.</Forms.FormText>
            </Card>

            <Card className="vc-settings-card">
                <Forms.FormTitle tag="h5">External Resources</Forms.FormTitle>
                <Forms.FormText>For security reasons, loading resources (styles, fonts, images, ...) from most sites is blocked.</Forms.FormText>
                <Forms.FormText>Make sure all your assets are hosted on GitHub, GitLab, Codeberg, Imgur, Discord or Google Fonts.</Forms.FormText>
            </Card>

            <section>
                <Forms.FormTitle tag="h5">Local Themes</Forms.FormTitle>
                <QuickActionCard>
                    <>
                        {IS_WEB ?
                            (
                                <QuickAction
                                    text={
                                        <span style={uploadSpanStyle}>
                                            Upload Theme
                                            <FileInput
                                                ref={fileInputRef}
                                                onChange={async e => {
                                                    await onFileUpload(e);
                                                    refreshLocalThemes();
                                                }}
                                                multiple={true}
                                                filters={[{ extensions: ["css"] }]}
                                            />
                                        </span>
                                    }
                                    Icon={PlusIcon}
                                />
                            ) : (
                                <QuickAction
                                    text="Open Themes Folder"
                                    action={() => VelocityNative.themes.openFolder()}
                                    Icon={FolderIcon}
                                />
                            )}
                        <QuickAction
                            text="Load missing Themes"
                            action={refreshLocalThemes}
                            Icon={RestartIcon}
                        />
                        <QuickAction
                            text="Edit QuickCSS"
                            action={() => VelocityNative.quickCss.openEditor()}
                            Icon={PaintbrushIcon}
                        />

                        {Velocity.Plugins.isPluginEnabled(ClientThemePlugin.name) && (
                            <QuickAction
                                text="Edit ClientTheme"
                                action={() => openPluginModal(ClientThemePlugin)}
                                Icon={PencilIcon}
                            />
                        )}
                    </>
                </QuickActionCard>

                <div className={cl("grid")}>
                    {normalThemes.map(theme => (
                        <AddonCard
                            key={theme.fileName}
                            name={theme.name}
                            description={theme.description}
                            author={theme.author}
                            enabled={settings.enabledThemes.includes(theme.fileName)}
                            setEnabled={enabled => onLocalThemeChange(theme.fileName, enabled)}
                            infoButton={
                                <div
                                    style={{ cursor: "pointer", marginLeft: "8px" }}
                                    onClick={() => {
                                        Velocity.Webpack.Common.Alerts.show({
                                            title: "Delete Theme",
                                            body: `Are you sure you want to delete "${theme.name}"? This action cannot be undone.`,
                                            confirmText: "Delete",
                                            cancelText: "Cancel",
                                            confirmColor: "vc-button-danger",
                                            onConfirm: async () => {
                                                onLocalThemeChange(theme.fileName, false);
                                                await VelocityNative.themes.deleteTheme(theme.fileName);
                                                showToast(`Theme "${theme.name}" deleted`, Toasts.Type.SUCCESS);
                                                refreshLocalThemes();
                                            }
                                        });
                                    }}
                                >
                                    <DeleteIcon width={20} height={20} />
                                </div>
                            }
                        />
                    ))}
                </div>

                {requiredThemes.length > 0 && (
                    <>
                        <Forms.FormDivider className={Margins.top20} />
                        <Forms.FormTitle tag="h5" className={classes(Margins.top20, Margins.bottom8)}>
                            Required Themes
                        </Forms.FormTitle>
                        <div className={cl("grid")}>
                            {requiredThemes.map(theme => (
                                <Tooltip key={theme.fileName} text="This theme is required for Velocity to function.">
                                    {tooltipProps => (
                                        <div {...tooltipProps}>
                                            <AddonCard
                                                name={theme.name}
                                                description={theme.description}
                                                author={theme.author}
                                                enabled={settings.enabledThemes.includes(theme.fileName)}
                                                setEnabled={() => { }}
                                                disabled={true}
                                            />
                                        </div>
                                    )}
                                </Tooltip>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </>
    );
}

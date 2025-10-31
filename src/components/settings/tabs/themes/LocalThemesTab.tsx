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

import { Settings, useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { Divider } from "@components/Divider";
import { DeleteIcon, FolderIcon, PaintbrushIcon, PencilIcon, PlusIcon, RestartIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Margins } from "@components/margins";
import { AddonCard } from "@components/settings/AddonCard";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { UserThemeHeader } from "@main/themes";
import { classes } from "@utils/misc";
import { closeModal, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { findLazy } from "@webpack";
import { Button, Card, Forms, Select, showToast, TextInput, Toasts, Tooltip, useEffect, useRef, useState } from "@webpack/common";
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

async function onFileUpload(e: SyntheticEvent<HTMLInputElement>, callback: () => void) {
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
    callback();
}
function CreateThemeModal({ onSuccess, modalKey, transitionState, ...props }: {
    onSuccess: () => void;
    modalKey: string;
    transitionState: any;
    [key: string]: any;
}) {
    const [fileName, setFileName] = useState("");
    const [cssCode, setCssCode] = useState("");
    const editorRef = useRef<any>(null);
    const editorInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!editorRef.current || editorInstanceRef.current) return;

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/loader.js";

        script.onload = () => {
            (window as any).require.config({
                paths: {
                    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs",
                },
            });

            (window as any).require(["vs/editor/editor.main"], () => {
                const editor = (window as any).monaco.editor.create(editorRef.current, {
                    value: "",
                    language: "css",
                    theme: "vs-dark",
                    minimap: { enabled: false },
                    automaticLayout: true,
                });

                editorInstanceRef.current = editor;
                editor.onDidChangeModelContent(() => {
                    setCssCode(editor.getValue());
                });
            });
        };

        document.head.appendChild(script);

        return () => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current.dispose();
            }
        };
    }, []);

    return (
        <ModalRoot transitionState={transitionState} size={ModalSize.LARGE}>
            <ModalHeader>
                <Forms.FormTitle tag="h2" className={Margins.bottom16}>Create New Theme</Forms.FormTitle>
            </ModalHeader>

            <ModalContent>
                <div style={{ marginBottom: "16px" }}>
                    <Forms.FormTitle tag="h5">Theme Name</Forms.FormTitle>
                    <TextInput
                        placeholder="MyTheme.css"
                        onChange={setFileName}
                    />
                </div>

                <Divider className={Margins.bottom16} />

                <div style={{
                    height: "400px",
                    border: "1px solid var(--background-modifier-accent)",
                    borderRadius: "6px",
                    overflow: "hidden"
                }}>
                    <div ref={editorRef} style={{ width: "100%", height: "100%" }} />
                </div>
            </ModalContent>

            <ModalFooter>
                <Button
                    color={Button.Colors.BRAND}
                    look={Button.Looks.FILLED}
                    style={{ padding: "10px 20px" }}
                    onClick={async () => {
                        if (!fileName.trim() || !cssCode.trim()) {
                            showToast("You must enter a file name and some CSS code.", Toasts.Type.FAILURE);
                            return;
                        }

                        let finalFileName = fileName;
                        if (!finalFileName.endsWith(".css"))
                            finalFileName += ".css";

                        const existing = await VelocityNative.themes.getThemesList();
                        if (existing.some(t => t.fileName === finalFileName)) {
                            Velocity.Webpack.Common.Alerts.show({
                                title: "File Already Exists",
                                body: `A theme named "${finalFileName}" already exists. Please choose a different name.`,
                                confirmText: "OK",
                                confirmColor: "vc-button-danger"
                            });
                            return;
                        }

                        try {
                            await VelocityNative.themes.uploadTheme(finalFileName, cssCode);
                            showToast(`Theme "${finalFileName}" created successfully!`, Toasts.Type.SUCCESS);
                            onSuccess();
                            closeModal(modalKey);
                        } catch (err) {
                            console.error("[Velocity] Failed to create theme:", err);
                            showToast("Failed to create theme.", Toasts.Type.FAILURE);
                        }
                    }}
                >
                    Create
                </Button>


                <Button
                    look={Button.Looks.LINK}
                    color={Button.Colors.BRAND}
                    style={{ padding: "10px 20px" }}
                    onClick={() => closeModal(modalKey)}
                >
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

function EditThemeModal({ onSuccess, modalKey, transitionState, ...props }: {
    onSuccess: () => void;
    modalKey: string;
    transitionState: any;
    [key: string]: any;
}) {
    const [selectedTheme, setSelectedTheme] = useState("");
    const [cssCode, setCssCode] = useState("");
    const [themes, setThemes] = useState<UserThemeHeader[]>([]);
    const editorRef = useRef<any>(null);
    const editorInstanceRef = useRef<any>(null);

    useEffect(() => {
        VelocityNative.themes.getThemesList().then(setThemes);
    }, []);

    useEffect(() => {
        if (!selectedTheme) return;
        VelocityNative.themes.getThemeData(selectedTheme).then(data => {
            setCssCode(data || "");
            if (editorInstanceRef.current) {
                editorInstanceRef.current.setValue(data || "");
            }
        });
    }, [selectedTheme]);

    useEffect(() => {
        if (!editorRef.current || editorInstanceRef.current) return;

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/loader.js";

        script.onload = () => {
            (window as any).require.config({
                paths: {
                    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs",
                },
            });

            (window as any).require(["vs/editor/editor.main"], () => {
                const editor = (window as any).monaco.editor.create(editorRef.current, {
                    value: cssCode,
                    language: "css",
                    theme: "vs-dark",
                    minimap: { enabled: false },
                    automaticLayout: true,
                });

                editorInstanceRef.current = editor;
                editor.onDidChangeModelContent(() => {
                    setCssCode(editor.getValue());
                });
            });
        };

        document.head.appendChild(script);

        return () => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current.dispose();
            }
        };
    }, []);

    const selectedThemeData = themes.find(t => t.fileName === selectedTheme);

    return (
        <ModalRoot transitionState={transitionState} size={ModalSize.LARGE}>
            <ModalHeader>
                <Forms.FormTitle tag="h2" className={Margins.bottom16}>Edit Theme</Forms.FormTitle>
            </ModalHeader>

            <ModalContent>
                <div style={{ marginBottom: "16px" }}>
                    <Forms.FormTitle tag="h5">Select Theme</Forms.FormTitle>
                    <Select
                        options={themes.map(theme => ({
                            label: theme.name,
                            value: theme.fileName
                        }))}
                        isSelected={v => v === selectedTheme}
                        select={setSelectedTheme}
                        serialize={v => v}
                    />
                </div>

                {selectedThemeData && (
                    <div style={{ marginBottom: "16px" }}>
                        <Forms.FormText>
                            <strong>Author:</strong> {selectedThemeData.author}
                        </Forms.FormText>
                        {selectedThemeData.description && (
                            <Forms.FormText>
                                <strong>Description:</strong> {selectedThemeData.description}
                            </Forms.FormText>
                        )}
                        {selectedThemeData.version && (
                            <Forms.FormText>
                                <strong>Version:</strong> {selectedThemeData.version}
                            </Forms.FormText>
                        )}
                    </div>
                )}

                <Divider className={Margins.bottom16} />

                <div style={{
                    height: "400px",
                    border: "1px solid var(--background-modifier-accent)",
                    borderRadius: "6px",
                    overflow: "hidden"
                }}>
                    <div ref={editorRef} style={{ width: "100%", height: "100%" }} />
                </div>
            </ModalContent>

            <ModalFooter>
                <Button
                    color={Button.Colors.BRAND}
                    look={Button.Looks.FILLED}
                    disabled={!selectedTheme}
                    style={{ padding: "10px 20px" }}
                    onClick={async () => {
                        if (!selectedTheme || !cssCode.trim()) {
                            showToast("You must select a theme and provide CSS code.", Toasts.Type.FAILURE);
                            return;
                        }

                        try {
                            await VelocityNative.themes.uploadTheme(selectedTheme, cssCode);
                            showToast(`Theme "${selectedTheme}" updated successfully!`, Toasts.Type.SUCCESS);
                            onSuccess();
                            closeModal(modalKey);
                        } catch (err) {
                            console.error("[Velocity] Failed to update theme:", err);
                            showToast("Failed to update theme.", Toasts.Type.FAILURE);
                        }
                    }}
                >
                    Save
                </Button>

                <Button
                    look={Button.Looks.LINK}
                    color={Button.Colors.BRAND}
                    style={{ padding: "10px 20px" }}
                    onClick={() => closeModal(modalKey)}
                >
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}


function openCreateThemeModal(onSuccess: () => void) {
    const key = openModal(props => (
        <CreateThemeModal onSuccess={onSuccess} modalKey={key} {...props} />
    ));
}


function openEditThemeModal(onSuccess: () => void) {
    const key = openModal(props => (
        <EditThemeModal onSuccess={onSuccess} modalKey={key} {...props} />
    ));
}

const linkContainerStyle: CSSProperties = { marginBottom: ".5em", display: "flex", flexDirection: "column" };
const linkStyle: CSSProperties = { marginRight: ".5em" };
const uploadSpanStyle: CSSProperties = { position: "relative" };
const IS_WEB = typeof window !== "undefined" && !window.VelocityNative;

export function LocalThemesTab() {
    const settings = useSettings(["enabledThemes"]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [userThemes, setUserThemes] = useState<UserThemeHeader[] | null>(null);

    const refreshLocalThemes = async () => {
        const themes = await VelocityNative.themes.getThemesList();
        setUserThemes(themes);
    };

    useEffect(() => {
        refreshLocalThemes();
    }, []);

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
                        <QuickAction
                            text="Create New Theme"
                            action={() => openCreateThemeModal(refreshLocalThemes)}
                            Icon={PlusIcon()}
                        />
                        {IS_WEB ? (
                            <QuickAction
                                text={
                                    <span style={uploadSpanStyle}>
                                        Upload Theme
                                        <FileInput
                                            ref={fileInputRef}
                                            onChange={async e => {
                                                await onFileUpload(e, refreshLocalThemes);
                                            }}
                                            multiple={true}
                                            filters={[{ extensions: ["css"] }]}
                                        />
                                    </span>
                                }
                                Icon={PlusIcon()}
                            />
                        ) : (
                            <QuickAction
                                text="Open Themes Folder"
                                action={() => VelocityNative.themes.openFolder()}
                                Icon={FolderIcon()}
                            />
                        )}
                        <QuickAction
                            text="Load missing Themes"
                            action={refreshLocalThemes}
                            Icon={RestartIcon()}
                        />
                        <QuickAction
                            text="Edit QuickCSS"
                            action={() => VelocityNative.quickCss.openEditor()}
                            Icon={PaintbrushIcon()}
                        />
                        <QuickAction
                            text="Edit Theme"
                            action={() => openEditThemeModal(refreshLocalThemes)}
                            Icon={PencilIcon()}
                        />
                        {Velocity.Plugins.isPluginEnabled(ClientThemePlugin.name) && (
                            <QuickAction
                                text="Edit ClientTheme"
                                action={() => openPluginModal(ClientThemePlugin)}
                                Icon={PencilIcon()}
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
                                <Tooltip text="Delete Theme">
                                    {tooltipProps => (
                                        <div
                                            {...tooltipProps}
                                            style={{
                                                cursor: "pointer",
                                                marginLeft: "8px",
                                                color: "var(--status-danger)"
                                            }}
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
                                            {DeleteIcon()()}
                                        </div>
                                    )}
                                </Tooltip>
                            }

                        />
                    ))}
                </div>

                {requiredThemes.length > 0 && (
                    <>
                        <Divider className={Margins.top20} />
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

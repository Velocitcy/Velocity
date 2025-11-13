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

import { get, set } from "@api/DataStore";
import { CodeBlock } from "@components/CodeBlock";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { HeadingTertiary } from "@components/Heading";
import { CogWheel, DeleteIcon, ErrorIcon, Icon, PlusIcon } from "@components/Icons";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { copyWithToast } from "@utils/misc";
import { openModal } from "@utils/modal";
import { Button, FontClasses, Forms, React, TextArea, TextInput, useState } from "@webpack/common";

import { SvgRuleModal } from "./svgRuleModal";
import { SvgElement } from "./types";
import { generateCode, makeEmptySvg, renderElement } from "./utils";

function IconCreator() {
    const [svgs, setSvgs] = useState<SvgElement[]>([]);
    const [viewBox, setSvgBox] = useState("0 0 24 24");
    const [width, setWidth] = useState("24");
    const [height, setHeight] = useState("24");
    const [loaded, setLoaded] = useState(false);
    const [errors, setErrors] = useState<Record<number, string>>({});
    const [, forceUpdate] = useState({});

    React.useEffect(() => {
        (async () => {
            const saved = (await get("IconCreator")) ?? {
                svgs: [],
                viewBox: "0 0 24 24",
                width: "24",
                height: "24"
            };
            const loadedSvgs = saved.svgs ?? [];
            setSvgs(loadedSvgs.length === 0 ? [makeEmptySvg()] : loadedSvgs);
            setSvgBox(saved.viewBox || "0 0 24 24");
            setWidth(saved.width || "24");
            setHeight(saved.height || "24");
            setLoaded(true);

            const newErrors: Record<number, string> = {};
            if (loadedSvgs.length === 0) {
                const error = validateSvg(makeEmptySvg(), 0);
                if (error) {
                    newErrors[0] = error;
                }
            } else {
                loadedSvgs.forEach((svg, index) => {
                    const error = validateSvg(svg, index);
                    if (error) {
                        newErrors[index] = error;
                    }
                });
            }
            setErrors(newErrors);
        })();
    }, []);

    React.useEffect(() => {
        if (loaded) set("IconCreator", { svgs, viewBox, width, height });
    }, [svgs, viewBox, width, height, loaded]);

    function validateSvg(svg: SvgElement, index: number): string | null {
        try {
            if (svg.type === "path") {
                if (!svg.d || !svg.d.trim()) {
                    return "Path data is required";
                }
                const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pathEl.setAttribute("d", svg.d);
                svgEl.appendChild(pathEl);
                if (pathEl.getTotalLength() === 0 && svg.d.trim()) {
                    return "Invalid path data";
                }
            } else if (svg.type === "circle") {
                if (!svg.r || !svg.r.trim()) {
                    return "Radius is required";
                }
                if (isNaN(parseFloat(svg.r))) {
                    return "Invalid radius";
                }
            } else if (svg.type === "polygon") {
                if (!svg.points || !svg.points.trim()) {
                    return "Points are required";
                }
                const pointPairs = svg.points.trim().split(/\s+/);
                for (const pair of pointPairs) {
                    const coords = pair.split(",");
                    if (coords.length !== 2 || isNaN(parseFloat(coords[0])) || isNaN(parseFloat(coords[1]))) {
                        return "Invalid points format";
                    }
                }
            }
            return null;
        } catch (e) {
            return "Invalid SVG data";
        }
    }

    function onSvgChange(index: number, value: string) {
        const newSvgs = [...svgs];
        if (newSvgs[index].type === "path") {
            newSvgs[index].d = value;
        } else if (newSvgs[index].type === "circle") {
            newSvgs[index].r = value;
        } else if (newSvgs[index].type === "polygon") {
            newSvgs[index].points = value;
        }

        const error = validateSvg(newSvgs[index], index);
        const newErrors = { ...errors };
        if (error) {
            newErrors[index] = error;
        } else {
            delete newErrors[index];
        }
        setErrors(newErrors);
        setSvgs(newSvgs);
    }

    function addSvg() {
        const newSvg = makeEmptySvg();
        const newSvgs = [...svgs, newSvg];
        setSvgs(newSvgs);

        const error = validateSvg(newSvg, newSvgs.length - 1);
        if (error) {
            setErrors({ ...errors, [newSvgs.length - 1]: error });
        }
    }

    function removeSvg(index: number) {
        setSvgs(svgs.filter((_, i) => i !== index));
        const newErrors = { ...errors };
        delete newErrors[index];

        const reindexedErrors: Record<number, string> = {};
        Object.keys(newErrors).forEach(key => {
            const idx = parseInt(key);
            if (idx > index) {
                reindexedErrors[idx - 1] = newErrors[idx];
            } else {
                reindexedErrors[idx] = newErrors[idx];
            }
        });
        setErrors(reindexedErrors);
    }

    function onClickSettings(svg: SvgElement, index: number) {
        openModal(props => (
            <SvgRuleModal
                svg={svg}
                onSave={updatedSvg => {
                    const newSvgs = [...svgs];
                    newSvgs[index] = updatedSvg;
                    setSvgs(newSvgs);
                    forceUpdate({});
                }}
                onClose={props.onClose}
                transitionState={props.transitionState}
            />
        ));
    }

    if (!loaded) {
        return <SettingsTab title="Icon Creator"></SettingsTab>;
    }

    const hasElements = svgs.some(p => {
        if (p.type === "path") return !!p.d?.trim();
        if (p.type === "circle") return !!p.r?.trim();
        if (p.type === "polygon") return !!p.points?.trim();
        return false;
    });

    const hasEmptySvgs = svgs.some(p => {
        if (p.type === "path") return !p.d?.trim();
        if (p.type === "circle") return !p.r?.trim();
        if (p.type === "polygon") return !p.points?.trim();
        return true;
    });

    return (
        <SettingsTab title="Icon Creator">
            <HeadingTertiary className={Margins.top8}>Icon Settings</HeadingTertiary>

            <Flex style={{ gap: 8, marginBottom: 10 }} className={Margins.top8}>
                <div style={{ flex: 1 }}>
                    <Forms.FormText>Width</Forms.FormText>
                    <TextInput
                        type="number"
                        value={width}
                        onChange={setWidth}
                        placeholder="24"
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <Forms.FormText>Height</Forms.FormText>
                    <TextInput
                        type="number"
                        value={height}
                        onChange={setHeight}
                        placeholder="24"
                    />
                </div>
                <div style={{ flex: 2 }}>
                    <Forms.FormText>ViewBox</Forms.FormText>
                    <TextInput
                        type="text"
                        value={viewBox}
                        onChange={val => {
                            if (/^[\d\s]*$/.test(val)) {
                                setSvgBox(val);
                            }
                        }}
                        placeholder="0 0 24 24"
                    />
                </div>
            </Flex>

            <Divider style={{ margin: "20px 0" }} />

            <HeadingTertiary className={Margins.top8}>SVG Elements</HeadingTertiary>
            <Forms.FormText className={Margins.bottom8}>
                Add your SVG Elements d attributes
            </Forms.FormText>

            <Flex flexDirection="column" style={{ gap: "0.5em" }}>
                {svgs.map((svg, index) => {
                    const displayValue = svg.type === "path" ? svg.d || "" :
                        svg.type === "circle" ? svg.r || "" :
                            svg.type === "polygon" ? svg.points || "" : "";

                    return (
                        <Flex key={index} style={{ gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <TextArea
                                    value={displayValue}
                                    onChange={v => onSvgChange(index, v)}
                                    placeholder="Code here"
                                    error={errors[index]}
                                    autoFocus={index === svgs.length - 1}
                                    rows={Math.max(1, Math.ceil(displayValue.length / 80))}
                                />
                            </div>
                            <Button
                                size={Button.Sizes.MIN}
                                onClick={() => onClickSettings(svg, index)}
                                style={{ background: "none" }}
                            >
                                <CogWheel width="24" height="24" viewBox="0 0 24 24" />
                            </Button>
                            {index > 0 && (
                                <Button
                                    size={Button.Sizes.MIN}
                                    onClick={() => removeSvg(index)}
                                    style={{
                                        background: "none",
                                        color: "var(--status-danger)"
                                    }}
                                >
                                    <DeleteIcon width="24" height="24" viewBox="0 0 24 24" />
                                </Button>
                            )}
                        </Flex>
                    );
                })}
            </Flex>

            <Button
                onClick={addSvg}
                icon={() => <PlusIcon width="20" height="20" viewBox="0 0 24 24" />}
                size="small"
                color="brand"
                disabled={hasEmptySvgs}
                className={Margins.top8}
            >
                Add Path
            </Button>

            {hasElements && (
                <>
                    <Divider className={Margins.top16} />
                    <HeadingTertiary className={Margins.top16}>Preview</HeadingTertiary>
                    <Paragraph className={Margins.top8}>This preview is resized so you can see better</Paragraph>
                    <div className={Object.keys(errors).length > 0 ? "" : "colorDefault_c1e9c4"} style={{
                        padding: "40px",
                        borderRadius: 8,
                        marginTop: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "300px"
                    }}>
                        {Object.keys(errors).length > 0 ? (
                            <div className={FontClasses["display-sm"]} style={{ color: "var(--text-muted)" }}>
                                No preview available
                            </div>
                        ) : (
                            <Icon
                                width={(parseInt(width || "24") * 15).toString()}
                                height={(parseInt(height || "24") * 15).toString()}
                                viewBox={viewBox || "0 0 24 24"}
                            >
                                {svgs.map((svg, i) => renderElement(svg, i))}
                            </Icon>
                        )}
                    </div>

                    <HeadingTertiary className={Margins.top16} style={{ marginBottom: 5 }}>Generated Code</HeadingTertiary>
                    {Object.keys(errors).length > 0 ? (
                        <>
                            <ErrorIcon width="18" height="18" viewBox="0 0 24 24" style={{ color: "var(--status-danger)", verticalAlign: "middle", marginRight: 6 }} />
                            <Forms.FormText
                                style={{
                                    color: "var(--status-danger)",
                                    display: "inline"
                                }}
                            >
                                Couldn't generate code
                            </Forms.FormText>
                        </>
                    ) : (
                        <>
                            <CodeBlock lang="tsx" content={generateCode(svgs, width, height, viewBox)} />
                            <Button className={Margins.top8} onClick={() => copyWithToast(generateCode(svgs, width, height, viewBox))}>
                                Copy Code
                            </Button>
                        </>
                    )}
                </>
            )}
        </SettingsTab>
    );
}

export default (IS_DEV ? wrapTab(IconCreator, "IconCreator") : null) as any;

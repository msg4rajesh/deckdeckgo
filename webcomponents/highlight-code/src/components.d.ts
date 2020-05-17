/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { DeckdeckgoHighlightCodeAnchor, } from "./components/declarations/deckdeckgo-highlight-code-anchor";
export namespace Components {
    interface DeckgoHighlightCode {
        "anchor": string;
        "anchorZoom": string;
        "editable": boolean;
        "findNextAnchor": (enter: boolean) => Promise<DeckdeckgoHighlightCodeAnchor>;
        "hideAnchor": boolean;
        "highlightLines": string;
        "language": string;
        "lineNumbers": boolean;
        "load": () => Promise<void>;
        "src": string;
        "terminal": "carbon" | "ubuntu" | "none";
        "theme": "3024-night" | "a11y-dark" | "blackboard" | "base16-dark" | "base16-light" | "cobalt" | "dracula" | "duotone" | "hopscotch" | "lucario" | "material" | "monokai" | "night-owl" | "nord" | "oceanic-next" | "one-light" | "one-dark" | "panda" | "paraiso" | "seti" | "shades-of-purple" | "solarized-dark" | "solarized-light" | "synthwave" | "twilight" | "verminal" | "vscode" | "yeti" | "zenburn";
        "zoomCode": (zoom: boolean) => Promise<void>;
    }
}
declare global {
    interface HTMLDeckgoHighlightCodeElement extends Components.DeckgoHighlightCode, HTMLStencilElement {
    }
    var HTMLDeckgoHighlightCodeElement: {
        prototype: HTMLDeckgoHighlightCodeElement;
        new (): HTMLDeckgoHighlightCodeElement;
    };
    interface HTMLElementTagNameMap {
        "deckgo-highlight-code": HTMLDeckgoHighlightCodeElement;
    }
}
declare namespace LocalJSX {
    interface DeckgoHighlightCode {
        "anchor"?: string;
        "anchorZoom"?: string;
        "editable"?: boolean;
        "hideAnchor"?: boolean;
        "highlightLines"?: string;
        "language"?: string;
        "lineNumbers"?: boolean;
        "onCodeDidChange"?: (event: CustomEvent<HTMLElement>) => void;
        "onPrismLanguageLoaded"?: (event: CustomEvent<string>) => void;
        "src"?: string;
        "terminal"?: "carbon" | "ubuntu" | "none";
        "theme"?: "3024-night" | "a11y-dark" | "blackboard" | "base16-dark" | "base16-light" | "cobalt" | "dracula" | "duotone" | "hopscotch" | "lucario" | "material" | "monokai" | "night-owl" | "nord" | "oceanic-next" | "one-light" | "one-dark" | "panda" | "paraiso" | "seti" | "shades-of-purple" | "solarized-dark" | "solarized-light" | "synthwave" | "twilight" | "verminal" | "vscode" | "yeti" | "zenburn";
    }
    interface IntrinsicElements {
        "deckgo-highlight-code": DeckgoHighlightCode;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "deckgo-highlight-code": LocalJSX.DeckgoHighlightCode & JSXBase.HTMLAttributes<HTMLDeckgoHighlightCodeElement>;
        }
    }
}

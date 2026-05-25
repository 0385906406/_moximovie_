declare module "react-helmet" {
    import * as React from "react";

    interface HelmetProps {
        children?: React.ReactNode;
        title?: string;
        defaultTitle?: string;
        titleTemplate?: string;
        onChangeClientState?: (newState: HelmetState) => void;
    }

    export interface HelmetState {
        baseTag?: Array<{ href?: string; target?: string }>;
        bodyAttributes?: Record<string, string>;
        htmlAttributes?: Record<string, string>;
        linkTags?: Array<Record<string, string>>;
        metaTags?: Array<Record<string, string>>;
        noscriptTags?: Array<Record<string, string>>;
        scriptTags?: Array<HelmetScriptTag>;
        styleTags?: Array<Record<string, string>>;
        title?: string;
        titleAttributes?: Record<string, string>;
    }

    export interface HelmetScriptTag {
        type?: string;
        src?: string;
        async?: boolean;
        defer?: boolean;
        crossOrigin?: string;
        integrity?: string;
        innerHTML?: string;
        charSet?: string;
        [key: string]: string | boolean | undefined;
    }

    export class Helmet extends React.Component<HelmetProps> { }
}
import env from "@esbuild-env";

export const ScriptControl = {
    ExecuteCurrentScript: `${env.EXTENSION_BASE_NAME}.executeCurrentScript`
} as const;
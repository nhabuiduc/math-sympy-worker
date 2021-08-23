import type { CasEngineNs } from "./cas-engine-ns";

export namespace CasMd {
    export type WorkerRequest = RunRequest | SetCtxRequest | RunRawRequest;

    export interface RunRequest {
        type: "run-request";
        action: CasEngineNs.RunAction;
    }

    export interface RunRawRequest {
        type: "run-raw-request";
        code: string;
        dump: boolean;
    }

    export interface SetCtxRequest {
        type: "set-ctx-request";
        ctx: WorkerInitCtx;
    }

    export type WorkerReponse = WorkerInitProgressResponse | WorkerInitDoneResponse | WorkerRunResponse | WorkerRunResponseError | WorkerInitCtxDoneResponse |
        WorkerRunRawCommandResponse | WorkerRunLogResponse;

    export interface WorkerInitProgressResponse {
        type: "init-progress-response";
        loaded: number;
        total: number;
    }

    export interface WorkerInitDoneResponse {
        type: "init-done-response";
    }

    export interface WorkerInitCtxDoneResponse {
        type: "init-ctx-done-response";
    }

    export interface WorkerRunResponse {
        type: "run-response";
        blocks: BlockModel[];
    }

    export interface WorkerRunLogResponse {
        type: "run-log-response";
        log: string;
    }

    export interface WorkerRunResponseError {
        type: "run-response-error";
        message: string;
    }

    export interface WorkerRunRawCommandResponse {
        type: "run-raw-command-response";
        message: [string, BlockModel[]];
    }

    export interface WorkerInitCtx {
        constantTextFuncs: string[];
    }
}
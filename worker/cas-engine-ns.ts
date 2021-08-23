export namespace CasEngineNs {
    export type RunAction = SubstituteRunAction ;
    export interface SubstituteRunAction {
        type: "substitute";
        expr: BlockModel[];
        from: BlockModel[];
        to: BlockModel[];
    }
}
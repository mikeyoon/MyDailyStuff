/**
 * Created by mike on 5/3/15.
 */

export interface JournalEntry {
    entries: string[];
    userId: string;
    date: Date;
}

export interface EmptyResponse {
    success: boolean;
    message: string;
}

export interface DataResponse<TResult> extends EmptyResponse {
    result: TResult;
}
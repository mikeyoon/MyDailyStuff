/**
 * Created by mike on 5/3/15.
 */

export interface JournalEntry {
    entries: string[];
    user_id: string;
    create_date: Date;
    date: Date;
    id: string;
}

export interface QuerySearchResult {
    result: JournalEntry[];
    total: number;
    success: true;
}

export interface EmptyResponse {
    success: boolean;
    message: string;
}

export interface DataResponse<TResult> extends EmptyResponse {
    result: TResult;
}
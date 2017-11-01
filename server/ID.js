// @flow
opaque type ID_of<T> = string;
opaque type Candidate_ID_of<T> = string;

/**
 * constructor type for ID_of type so that IDs can be passed around without explicitly converting them to strings
 */
export function make_id_of<T>(
  id_candidate: string | Candidate_ID_of<T>,
): ID_of<T> {
  return id_candidate;
}

export function make_candidate_id_of<T>(id_candidate: string): ID_of<T> {
  return id_candidate;
}

export function id_to_string<T>(id: ID_of<T> | Candidate_ID_of<T>): string {
  return id;
}

export type { ID_of, Candidate_ID_of };

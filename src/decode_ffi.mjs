import { Ok, Error, List, NonEmpty } from "./gleam.mjs";
import { default as Dict } from "../gleam_stdlib/dict.mjs";
import { Some, None } from "../gleam_stdlib/gleam/option.mjs";
import { DecodeError, classify } from "../gleam_stdlib/gleam/dynamic.mjs";

export function strict_index(data, key) {
  const int = Number.isInteger(key);

  // Dictionaries and dictionary-like objects can be indexed
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token = {};
    const entry = data.get(key, token);
    if (entry === token) return new Ok(new None());
    return new Ok(new Some(entry));
  }

  // The first 3 elements of lists can be indexed
  if ((key === 0 || key === 1 || key === 2) && data instanceof List) {
    let i = 0;
    for (const value of data) {
      if (i === key) return new Ok(new Some(value));
      i++;
    }
    return new Error("Indexable");
  }

  // Arrays and objects can be indexed
  if (
    (int && Array.isArray(data)) ||
    (data && typeof data === "object") ||
    (data && Object.getPrototypeOf(data) === Object.prototype)
  ) {
    if (key in data) return new Ok(new Some(data[key]));
    return new Ok(new None());
  }

  return new Error(int ? "Indexable" : "Dict");
}

export function index(data, key) {
  const int = Number.isInteger(key);

  // Dictionaries and dictionary-like objects can be indexed
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const entry = data.get(key, undefined);
    return new Ok(entry);
  }

  // The first 3 elements of lists can be indexed
  if ((key === 1 || key === 2) && data instanceof List) {
    let i = 0;
    for (const value of data) {
      if (i === key) return new Ok(value);
      i++;
    }
    return new Error("Indexable");
  }

  // Arrays and objects can be indexed
  if (
    (int && Array.isArray(data)) ||
    (data && typeof data === "object") ||
    (data && Object.getPrototypeOf(data) === Object.prototype)
  ) {
    return new Ok(data[key]);
  }

  return new Error(int ? "Indexable" : "Dict");
}

export function list(data, decode, pushPath, index, emptyList) {
  if (!(data instanceof List || Array.isArray(data))) {
    let error = new DecodeError("List", classify(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }

  const decoded = [];

  for (const element of data) {
    const layer = decode(element);
    const [out, errors] = layer;

    if (errors instanceof NonEmpty) {
      const [_, errors] = pushPath(layer, index.toString());
      return [emptyList, errors];
    }
    decoded.push(out);
    index++;
  }

  return [List.fromArray(decoded), emptyList];
}

export function dict(data) {
  if (data instanceof Dict) {
    return new Ok(data);
  }
  return new Error();
}

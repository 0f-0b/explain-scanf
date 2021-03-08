import { getCode, putCode } from "./_lib/code.ts";
import type { ServerRequest, Type } from "./_lib/deps.ts";
import { Schema, string } from "./_lib/deps.ts";
import { getJSON, getParams, notFound, putJSON, undefinedParam } from "./_lib/req.ts";

const codeSchema = Schema({ format: string, input: string });
type Code = Type<typeof codeSchema>;
const validateCode: (val: unknown) => asserts val is Code = (validate => (val: unknown) => {
  const [err] = validate(val as Code);
  if (err)
    throw err;
})(codeSchema.destruct());

async function get(req: ServerRequest): Promise<void> {
  const params = getParams(req);
  const id = params.get("id");
  if (id === null)
    return await undefinedParam(req, "id");
  const code = await getCode(id);
  if (code === undefined)
    return await notFound(req);
  const { format, input } = code;
  return await putJSON(req, { format, input }, { status: 200 });
}

async function post(req: ServerRequest): Promise<void> {
  const code = await getJSON(req);
  try {
    validateCode(code);
  } catch (e) {
    if (e instanceof TypeError)
      return await req.respond({ status: 400, body: `Bad Request: ${e.message}` });
    throw e;
  }
  const id = await putCode(code.format, code.input);
  return await req.respond({ status: 201, body: id });
}

export default (req: ServerRequest): Promise<void> => {
  switch (req.method) {
    case "GET":
      return get(req);
    case "POST":
      return post(req);
    default:
      return req.respond({ status: 405, body: "Method Not Allowed" });
  }
};

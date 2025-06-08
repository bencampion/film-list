import child_process from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(child_process.exec);

export default async function () {
  const { stdout } = await exec("git rev-parse --short HEAD");
  return { commitHash: stdout.trim() };
}

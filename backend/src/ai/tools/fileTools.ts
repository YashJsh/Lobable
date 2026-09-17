import { getSandbox } from "../../utils/e2b";
import { getAbsolutePath } from "../utils";

export const WORKSPACE_ROOT = "/home/user/next-app";

export const IGNORE = ['node_modules', '.next', '.npm', '.config', 'public'];

export const getFiles = async (
  args: unknown,
  options?: {
    emit?: (event: any) => void;
    workspaceRoot?: string;
    sandboxId?: string;
  }
) => {
  const { path } = (args ?? {}) as { path?: string };
  const workspaceRoot = options?.workspaceRoot || WORKSPACE_ROOT;
  const target = path ? getAbsolutePath(workspaceRoot, path) : workspaceRoot;

  const sandbox = await getSandbox(options?.sandboxId);
  const all = await sandbox.files.list(target, { depth: 99 });
  const filtered_files = all.filter(f => {
    const relative = f.path.replace(workspaceRoot, '');
    return !relative.split('/').some(p => IGNORE.includes(p));
  });
  return JSON.stringify(filtered_files);
}

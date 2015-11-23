import * as vscode from 'vscode';
import * as cp from 'child_process';
import {getIndicesOf} from './elmUtils'

let repl: cp.ChildProcess;
let oc = vscode.window.createOutputChannel("Elm REPL")

function startRepl() {
  if (repl) {
    repl.kill();
    oc.clear();
  }
  repl = cp.spawn('elm', ['repl'], { cwd: vscode.workspace.rootPath });
  repl.stdout.on('data', (data : Object) => {
    if (data && data.toString().startsWith("| ") == false) {
      oc.append(data.toString());
    }
  });
  repl.stderr.on('data', (data) => {
    if (data) {
      oc.append(data.toString());
    }
  });
  oc.show(vscode.ViewColumn.Three);
}

function send(msg: string) {
  if (!repl) {
    startRepl();
  }
  const indices = msg.indexOf("\n");
  if (indices == -1)
  {
    oc.append(msg + "\n");
    repl.stdin.write(msg + "\n", 'utf-8');
  }  
  else
  {
    msg.split("\r\n").forEach((m) => {
      var a = m + "\\\n"
      oc.append(m + "\n");
      repl.stdin.write(a, 'utf-8');
    });
    oc.append("\r\n");
    repl.stdin.write("\n");
  }
}

function sendLine(editor : vscode.TextEditor) {
  if (editor.document.languageId != 'elm') {
    return;
  }
  const line = editor.document.lineAt(editor.selection.start);
  send(line.text);
}

function sendSelection(editor : vscode.TextEditor) {
  if (editor.document.languageId != 'elm') {
    return;
  }
  const range = new vscode.Range(editor.selection.anchor, editor.selection.active)
  send(editor.document.getText(range));  
}

function sendFile(editor : vscode.TextEditor) {
  if (editor.document.languageId != 'elm') {
    return;
  }
  send(editor.document.getText());
}

export function activateRepl() : vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('elm.replStart', startRepl),
    vscode.commands.registerTextEditorCommand('elm.replSendLine', sendLine),
    vscode.commands.registerTextEditorCommand('elm.replSendSelection', sendSelection),
    vscode.commands.registerTextEditorCommand('elm.replSendFile', sendFile) ]
}
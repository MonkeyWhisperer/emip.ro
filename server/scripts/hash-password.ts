// Prints an ADMIN_PASSWORD_HASH value for .env.
// Usage: npm run admin:hash-password   (prompts for the password; typing is not echoed)
//    or: ADMIN_PASSWORD=... npm run admin:hash-password
//    or: pipe it in: echo ... | npm run admin:hash-password
import { createInterface } from "node:readline";
import { hashPassword } from "../auth.ts";

/** Reads one line from the terminal without echoing it (a "*" per character). */
function readHidden(prompt: string): Promise<string> {
  const stdin = process.stdin;
  if (!stdin.isTTY) {
    // Piped input: nothing is echoed anyway; take the first line. Windows PowerShell 5.1 can put a
    // UTF-8 BOM in front of piped text; it must not become part of the password.
    return new Promise((resolve) => {
      const rl = createInterface({ input: stdin, terminal: false });
      let line: string | undefined;
      rl.once("line", (l) => {
        line = l;
        rl.close();
      });
      rl.once("close", () => resolve((line ?? "").replace(/^﻿/, "")));
    });
  }
  return new Promise((resolve) => {
    let value = "";
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    const done = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write("\n");
      resolve(value);
    };
    const onData = (chunk: string) => {
      if (chunk.startsWith("\u001b")) return; // arrow keys and other escape sequences
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") return done();
        if (ch === "\u0003") {
          // Ctrl+C
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value) {
            value = [...value].slice(0, -1).join("");
            process.stdout.write("\b \b");
          }
        } else if (ch >= " ") {
          value += ch;
          process.stdout.write("*");
        }
      }
    };
    stdin.on("data", onData);
  });
}

let password = process.env.ADMIN_PASSWORD;
if (!password) {
  password = await readHidden("Parolă admin: ");
  if (process.stdin.isTTY && password.length >= 12 && (await readHidden("Confirmați parola: ")) !== password) {
    console.error("Parolele nu coincid.");
    process.exit(1);
  }
}
if (!password || password.length < 12) {
  console.error("Parola trebuie să aibă cel puțin 12 caractere.");
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH='${await hashPassword(password)}'`);

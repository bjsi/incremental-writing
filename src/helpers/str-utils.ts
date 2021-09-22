declare global {
  interface String {
    withExtension(extension: string): string;
    rtrim(chars: string): string;
  }
}

String.prototype.withExtension = function (extension: string): string {
  return String(this).rtrim(extension) + extension;
};

String.prototype.rtrim = function (chars: string): string {
  const from = String(this);
  let end = from.length - 1;
  while (chars.indexOf(from[end]) >= 0) {
    end -= 1;
  }
  return from.substr(0, end + 1);
};

export {};

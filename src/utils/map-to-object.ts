export function mapToObject(source: Map<string, any>) {
   return Object.fromEntries(source.entries());
}

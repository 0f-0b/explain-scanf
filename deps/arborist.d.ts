export class Arborist {
  constructor(options?: unknown);
  buildIdealTree(): Promise<Node>;
}

export interface Node {
  name: string;
  edgesOut: Map<string, Edge>;
  version: string;
  root: Node;
}

export interface Edge {
  to: Node;
}

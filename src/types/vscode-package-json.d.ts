export interface ExtensionPackageJSON {
  activationEvents: string[];
  contributes: {
    commands?: { command: string; title: string }[];
    configuration?: {
      title: string;
      properties: Record<string, ConfigItem>;
    };
  };
}
type ConfigItem = NumberConfig | BooleanConfig | StringConfig;
interface BaseConfig {
  description?: string;
}
export interface NumberConfig extends BaseConfig {
  type: "number";
  default: number;
}

export interface BooleanConfig extends BaseConfig {
  type: "boolean";
  default: boolean;
}

export interface StringConfig extends BaseConfig {
  type: "string";
  default: string;
  enum?: string[];
}

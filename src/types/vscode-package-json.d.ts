export interface CommandConfig {
  command: string;
  title: string;
  icon?: {
    light?: string;
    dark?: string;
  };
}

export interface ExtensionPackageJSON {
  activationEvents?: string[];
  contributes: {
    commands?: CommandConfig[];
    configuration?: {
      title: string;
      properties: Record<string, ConfigItem>;
    };
    menus?: Partial<
      Record<
        "view/item/context" | "view/title",
        {
          command: string;
          group?: "inline" | "navigation";
          when?: string;
          alt?: string;
        }[]
      >
    >;
    views?: Record<
      string,
      {
        id: string;
        name?: string;
      }[]
    >;
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

import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly onSessionEvent: CodegenTypes.EventEmitter<string>;
  open(optionsJson: string): Promise<string>;
  close(): void;
  isOpen(): boolean;
  logout(email: string): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('GravatarQuickEditor');

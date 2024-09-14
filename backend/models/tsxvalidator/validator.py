import logging
import subprocess
import os
import json
import uuid
from typing import Dict, Any
from pathlib import Path

# NODEJS_PATH = r"D:\.dev\nodejs"


class TSXValidator:
    def __init__(self, base_dir: str = "./tsx_validator_env"):
        self.base_dir = Path(base_dir)
        # self.nodejs_path = NODEJS_PATH
        self.setup_environment()

    def setup_environment(self):
        if not self.base_dir.exists():
            self.base_dir.mkdir(parents=True)
            self._create_package_json()
            self._create_tsconfig()
            self._install_dependencies()

    def _create_package_json(self):
        package_json = {
            "name": "tsx-validator",
            "version": "1.0.0",
            "private": True,
            "dependencies": {
                "react": "^17.0.2",
                "react-dom": "^17.0.2",
                "@types/react": "^17.0.38",
                "@types/react-dom": "^17.0.11",
                "typescript": "^4.5.5",
                "@nlmk/ds-2.0": "latest"
            }
        }
        with open(self.base_dir / "package.json", "w") as f:
            json.dump(package_json, f, indent=2)

    def _create_tsconfig(self):
        tsconfig = {
            "compilerOptions": {
                "target": "es5",
                "lib": ["dom", "dom.iterable", "esnext"],
                "allowJs": True,
                "skipLibCheck": True,
                "esModuleInterop": True,
                "allowSyntheticDefaultImports": True,
                "strict": True,
                "forceConsistentCasingInFileNames": True,
                "noFallthroughCasesInSwitch": True,
                "module": "esnext",
                "moduleResolution": "node",
                "resolveJsonModule": True,
                "isolatedModules": True,
                "noEmit": True,
                "jsx": "react-jsx"
            },
            "include": ["src"]
        }
        with open(self.base_dir / "tsconfig.json", "w") as f:
            json.dump(tsconfig, f, indent=2)

    def _install_dependencies(self):
        try:
            result = subprocess.run(
                ["npm", "install"],
                cwd=self.base_dir,
                check=True,
                capture_output=True,
                text=True,
                shell=True
            )
            print("Dependencies installed successfully.")
        except Exception as e:
            print(f"Error installing dependencies: {e}")

    def validate_tsx(self, tsx_code: str) -> Dict[str, Any]:
        unique_id = uuid.uuid4().hex
        temp_file = self.base_dir / "src" / f"temp_{unique_id}.tsx"
        self.base_dir.joinpath("src").mkdir(exist_ok=True)

        with open(temp_file, "w") as f:
            f.write(tsx_code)

        try:
            result = subprocess.run(
                ["npx", "tsc", "--noEmit", str(temp_file)],  # custom node
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                check=True,
                shell=True
            )

            # Если команда завершилась успешно
            if result.returncode == 0:
                return {"valid": True, "errors": None}
            else:
                # Если команда завершилась с ошибками (но без исключений)
                return {"valid": False, "errors": result.stderr + result.stdout}
        except subprocess.CalledProcessError as e:
            # Обработка исключений
            return {
                "valid": False,
                "errors": e.stderr + e.stdout + str(e)
            }
        finally:
            # Удаление временного файла
            temp_file.unlink()

    def _parse_errors(self, error_output: str) -> Dict[str, Any]:
        lines = error_output.split('\n')
        parsed_errors = []

        for line in lines:
            if 'ERROR' in line:
                parts = line.split('ERROR')
                if len(parts) == 2:
                    location, error_message = parts
                    error_code = error_message.split(':')[0]
                    message = error_message.split(':', 1)[1].strip()
                    parsed_errors.append({
                        "location": location,
                        "code": error_code,
                        "message": message
                    })

        return {
            "valid": False,
            "errors": parsed_errors
        }

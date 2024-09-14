import logging
import subprocess
import os
import json
import uuid
from typing import Dict, Any
from pathlib import Path
import shutil


class TSXValidator:
    def __init__(self, base_dir: str = "./tsx_validator_env"):
        self.base_dir = Path(base_dir)
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
                "@nlmk/ds-2.0": "^latest"
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
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        npm_path = shutil.which(npm_cmd)
        if npm_path is None:
            raise EnvironmentError(f"Cannot find {npm_cmd} in PATH")
        subprocess.run([npm_path, "install"], cwd=self.base_dir, check=True, capture_output=True)

    def validate_tsx(self, tsx_code: str) -> Dict[str, Any]:
        unique_id = uuid.uuid4().hex
        temp_file = self.base_dir / "src" / f"temp_{unique_id}.tsx"
        self.base_dir.joinpath("src").mkdir(exist_ok=True)

        with open(temp_file, "w") as f:
            f.write(tsx_code)

        try:
            npx_cmd = "npx.cmd" if os.name == "nt" else "npx"
            npx_path = shutil.which(npx_cmd)
            if npx_path is None:
                raise EnvironmentError(f"Cannot find {npx_cmd} in PATH")
            
            result = subprocess.run(
                [npx_path, "tsc", "--noEmit", str(temp_file)],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode == 0:
                return {"valid": True, "errors": None}
            else:
                return self._parse_errors(result.stderr)
        finally:
            temp_file.unlink()

    def _parse_errors(self, error_output: str) -> Dict[str, Any]:
        lines = error_output.split('\n')
        parsed_errors = []

        for line in lines:
            if ': error TS' in line:
                parts = line.split(': error TS')
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

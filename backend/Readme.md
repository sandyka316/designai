source /mnt/d/app/Celerates/backend/venv_wsl/bin/activate

source venv_wsl/bin/activate

uvicorn main:app --reload --host 0.0.0.0 --port 8000
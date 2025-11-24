.PHONY: run stop clean open help install audio

# Default port for the web server
PORT ?= 8000

# PID file to track the server process
PID_FILE = .server.pid

help:
	@echo "Consensus Disagreement App - Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  make install - Install Python dependencies"
	@echo "  make audio   - Generate audio files from CSV data"
	@echo "  make run     - Start the Python HTTP server"
	@echo "  make open    - Open the app in your default browser"
	@echo "  make stop    - Stop the running server"
	@echo "  make clean   - Clean up temporary files"
	@echo "  make help    - Show this help message"
	@echo ""
	@echo "First time setup:"
	@echo "  make install  # Install dependencies"
	@echo "  make audio    # Generate audio files"
	@echo "  make open     # Run and open the app"

install:
	@echo "Installing Python dependencies..."
	@pip3 install -r requirements.txt
	@echo ""
	@echo "Checking for ffmpeg..."
	@which ffmpeg > /dev/null || (echo "⚠️  ffmpeg not found. Install with: brew install ffmpeg" && exit 1)
	@echo "✓ All dependencies installed"

audio:
	@echo "Generating audio files..."
	@python3 generate_audio.py
	@echo "✓ Audio generation complete"

run:
	@if [ -f $(PID_FILE) ]; then \
		echo "Server is already running (PID: $$(cat $(PID_FILE)))"; \
		echo "Use 'make stop' to stop it first"; \
	else \
		echo "Starting Python HTTP server on port $(PORT)..."; \
		python3 -m http.server $(PORT) > /dev/null 2>&1 & echo $$! > $(PID_FILE); \
		sleep 1; \
		echo "Server started at http://localhost:$(PORT)"; \
		echo "Access the app at: http://localhost:$(PORT)/consensus_disagreement_app.html"; \
	fi

open:
	@if [ ! -f $(PID_FILE) ]; then \
		echo "Server is not running. Starting it now..."; \
		$(MAKE) run; \
		sleep 1; \
	fi
	@echo "Opening app in browser..."
	@open http://localhost:$(PORT)/consensus_disagreement_app.html || xdg-open http://localhost:$(PORT)/consensus_disagreement_app.html || echo "Please manually open: http://localhost:$(PORT)/consensus_disagreement_app.html"

stop:
	@if [ -f $(PID_FILE) ]; then \
		echo "Stopping server (PID: $$(cat $(PID_FILE)))..."; \
		kill $$(cat $(PID_FILE)) 2>/dev/null || true; \
		rm -f $(PID_FILE); \
		echo "Server stopped."; \
	else \
		echo "No server is running."; \
	fi

clean: stop
	@echo "Cleaning up temporary files..."
	@rm -f $(PID_FILE)
	@echo "Clean complete."

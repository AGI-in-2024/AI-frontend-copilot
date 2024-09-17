import os
import sys
import logging
from typing import Final
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

# Add the project root directory to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(project_root)

from backend.models.workflow import generate

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Constants
TELEGRAM_BOT_TOKEN: Final[str] = os.environ.get('TELEGRAM_BOT_TOKEN', '7530163155:AAE4iMXX9M5Y1r7z1SA1Gzquw0yR_PrWYAI')

# Initialize ChatAnthropic
llm = ChatAnthropic(
    model="claude-3-5-sonnet-20240620",
    temperature=0,
    max_tokens=8000,
    timeout=60,
    max_retries=2,
    api_key=os.environ.get('ANTROPIC_API_KEY')
)

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    await update.message.reply_text('Hello! I can help generate UI components. Just send me a description.')

async def generate_ui(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate UI component based on user input."""
    user_input = update.message.text
    
    try:
        # Generate initial result
        result = generate(user_input)
        logger.info(f"Generated initial result: {result[:100]}...")  # Log first 100 chars
        
        # Improve the result using ChatAnthropic
        response = llm.invoke([
            SystemMessage(content="You are a senior React developer who helps with React code"),
            HumanMessage(content=f"Improve this code's visibility and style. It should be a fully completed component. Return only code and nothing else. No markdown, no text, no comments, no explanation, just code. Here is the code to improve: {result}"),
        ])
        
        generated_code = response.content
        
        # Send the generated code
        await update.message.reply_text(f"{generated_code}")
    except Exception as e:
        logger.error(f"Error in generate_ui: {str(e)}")
        await update.message.reply_text("An error occurred while generating the UI component. Please try again or simplify your request.")

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log errors caused by Updates."""
    logger.error(f"Update {update} caused error {context.error}")

def main() -> None:
    """Start the bot."""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN is not set in environment variables")
        return

    # Create the Application and pass it your bot's token
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, generate_ui))

    # Add error handler
    application.add_error_handler(error_handler)

    # Start the Bot
    application.run_polling(allowed_updates=Update.ALL_TYPES)
    logger.info("Bot started successfully")

if __name__ == '__main__':
    main()

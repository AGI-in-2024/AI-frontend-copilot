import os
import sys
import logging
from typing import Final
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import asyncio


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
TELEGRAM_BOT_TOKEN: Final[str] = os.environ.get('TELEGRAM_BOT_TOKEN', '7514422906:AAFMtZx2Y5FD83dD7SdGZStzLk4TvMKkSHs')
MAX_MESSAGE_LENGTH: Final[int] = 4096  # Telegram's max message length

# Initialize ChatAnthropic
# llm = ChatAnthropic(
#     model="claude-3-5-sonnet-20240620",
#     temperature=0,
#     max_tokens=8000,
#     timeout=60,
#     max_retries=2,
#     api_key=os.environ.get('ANTROPIC_API_KEY')
# )

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    await update.message.reply_text('Hello! I can help generate UI components. Just send me a description.')

async def generate_ui(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate UI component based on user input."""
    user_input = update.message.text
    
    try:
        # Show typing indicator
        await context.bot.send_chat_action(chat_id=update.effective_chat.id, action=ChatAction.TYPING)
        
        # Generate initial result (increased timeout to 15 minutes)
        result = await asyncio.wait_for(asyncio.to_thread(generate, user_input), timeout=900)
        logger.info(f"Generated initial result: {result[:100]}...")  # Log first 100 chars
        
        # Split and send the generated code in chunks
        for i in range(0, len(result), MAX_MESSAGE_LENGTH):
            chunk = result[i:i+MAX_MESSAGE_LENGTH]
            await update.message.reply_text(chunk)
            await asyncio.sleep(0.5)  # Small delay between messages for better UX
    except asyncio.TimeoutError:
        logger.error("Generation process timed out after 15 minutes")
        await update.message.reply_text("The generation process took too long. Please try a simpler request or contact the administrator.")
    except RecursionError as e:
        logger.error(f"RecursionError in generate_ui: {str(e)}")
        await update.message.reply_text("The generation process hit a recursion limit. Please try a simpler request or contact the administrator to increase the limit.")
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

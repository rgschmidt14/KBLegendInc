
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the local file
        await page.goto(f"file://{os.path.abspath('skill_tracker/index.html')}")

        # Create a new skill
        await page.click("#create-new-skill-btn")
        await page.fill("#skillName", "Test Skill")
        await page.fill("#authorName", "Jules")
        await page.fill("#overview", "This is a test skill")

        # Add a level
        await page.click("#add-level-btn")
        await page.fill(".level-form[data-level='0'] textarea", "Level 0 Description")
        await page.click(".level-form[data-level='0'] .add-task-btn[data-type='prove']")
        await page.fill(".level-form[data-level='0'] .tasks-container ul li .task-content", "Prove you can do a thing")

        await page.click("#publish-skill-button")

        # Select the skill
        await page.click("#open-skill-list-modal")
        await page.click(".skill-list-item")

        # Take a screenshot of the skill display
        await page.screenshot(path="jules-scratch/verification/skill_display.png")

        # Take a screenshot of the editor with tooltips
        await page.click("#edit-skill-btn")
        await page.screenshot(path="jules-scratch/verification/skill_editor_tooltips.png")

        # Close the editor
        await page.click("#skill-editor-modal .close-button")

        # Delete the skill
        page.on("dialog", lambda dialog: dialog.accept())
        await page.click("#delete-skill-btn")

        # Take a screenshot of the empty display
        await page.screenshot(path="jules-scratch/verification/empty_display.png")

        await browser.close()

if __name__ == "__main__":
    import os
    asyncio.run(main())

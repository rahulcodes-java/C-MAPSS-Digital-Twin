import time
import os
from playwright.sync_api import sync_playwright

os.makedirs('reports/figures', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1600, 'height': 900})
    page.goto('http://localhost:5173/')
    page.wait_for_timeout(2500)

    # 1. Nominal Cycle 1
    inputs = page.locator('.control-group input[type="number"]')
    inputs.nth(1).fill('1')
    inputs.nth(1).dispatch_event('change')
    page.wait_for_timeout(1000)
    page.screenshot(path='reports/figures/dashboard_nominal_cycle1.png')
    print('1. Captured nominal cycle 1')

    # 2. Engine Cross Section Close-up
    viewport_elem = page.locator('.engine-viewport')
    viewport_elem.screenshot(path='reports/figures/engine_cross_section_close.png')
    print('2. Captured engine cross section')

    # 3. Sensor strip close-up
    sensor_strip = page.locator('.sensor-info-strip')
    sensor_strip.screenshot(path='reports/figures/sensor_strip_close.png')
    print('3. Captured sensor strip')

    # 4. Critical Cycle 192
    inputs.nth(1).fill('192')
    inputs.nth(1).dispatch_event('change')
    page.wait_for_timeout(1500)
    page.screenshot(path='reports/figures/dashboard_critical_cycle192.png')
    print('4. Captured critical cycle 192')

    # 5. Diagnostics Panel Close-up
    diag_elem = page.locator('.workspace-right')
    diag_elem.screenshot(path='reports/figures/diagnostics_panel_close.png')
    print('5. Captured diagnostics panel')

    browser.close()

print('All screenshots captured successfully in reports/figures/!')

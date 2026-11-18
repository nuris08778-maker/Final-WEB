# Aura Shop

**Group:** SE-2538

**Team:**

- Nursultan Nurislam
- Sarbasov Ayan
- Zhanassyl Omar

**Topic:** online shop with clothes, gadgets and cosmetics.

## About the project

Aura Shop is a small multi-page store website. We started it as the midterm (HTML, CSS, Bootstrap), added JavaScript and jQuery forms, search, a table and a gallery for the endterm, and for the final project we added a theme switch, sign-in, an FAQ and live data from a public API.

## Pages

- index.html - home page with categories, popular items and the FAQ
- products.html - our products with search and filter, plus the live catalog from the API
- compare.html - product table where you can add, edit and delete rows
- about.html - about the shop, photo gallery and the AI usage note
- contact.html - contact form with validation
- register.html - registration form with a password strength bar
- signin.html - sign-in page

## What works

### Light and dark theme

The button is in the menu on every page. The choice is saved in localStorage, so the theme stays after a refresh.

![Home page, light theme](screenshots/home-light.png)

![Home page, dark theme](screenshots/home-dark.png)

![Mobile view](screenshots/mobile.png)

### Sign-in

The form checks the email and the password length. After a successful sign-in we save the email and a name taken from it in localStorage (no password is stored). The menu then shows "Hi, name" and a Sign out button, and the home page greets the user. The user stays signed in after a refresh. Sign out clears the saved data.

![Sign-in form with validation errors](screenshots/signin.png)

![Menu and home page after signing in](screenshots/signed-in.png)

### FAQ with jQuery

Six questions on the home page. A click opens or closes the answer with slideToggle(), and the icon switches between + and -.

![FAQ with one open answer](screenshots/faq-open.png)

### API

The catalog on the products page loads items from DummyJSON (https://dummyjson.com) with fetch(). You can search, pick a category, change the sorting, refresh the list, load more items and open a product to see its details. If a request fails, the page shows an error message with a "Try again" button.

![API catalog on the products page](screenshots/api-catalog.png)

![API error message with Try again button](screenshots/api-error.png)

### From the endterm

Form validation, live product search with category buttons, the CRUD table saved in localStorage, and the gallery with a lightbox.

## Technologies

HTML5, CSS3, Bootstrap 5, JavaScript, jQuery 3.7, Google Fonts, DummyJSON API.

## Files

```
index.html
products.html
compare.html
about.html
contact.html
register.html
signin.html
css/style.css
css/final.css
js/script.js
js/theme.js
js/auth.js
js/faq.js
js/api.js
screenshots/
README.md
```

## Who did what

- Nursultan Nurislam: sign-in page and the localStorage login logic, README
- Sarbasov Ayan: API catalog on the products page (search, filter, sorting, details, error handling)
- Zhanassyl Omar: theme switch, jQuery FAQ, responsive checks, publishing on GitHub Pages

## AI usage

We used AI strictly as a writing and proofreading assistant to help structure the README and polish the text of this report. All source code (including the theme switch, sign-in, FAQ, and API catalog) was written and tested manually by us, and we can explain how every part works. The same note is on the About page and in the footer of the website.

// The theme choice, shared by the switch (in the browser) and the
// layout's pre-paint script (written on the server). A plain module on
// purpose: a value exported from a "use client" file reaches the server
// as a reference, not as its value, which once made the script look up
// an undefined key and forget the choice on every reload.

export const THEME_KEY = "openhouse-theme";

export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

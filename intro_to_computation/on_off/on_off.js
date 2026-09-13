console.log("hello world");

document.addEventListener("DOMContentLoaded", function() {
    console.log("The DOM has loaded");
    let back = document.getElementById('back');
    let b1 = document.getElementById('c11');
    let allcircles = document.querySelectorAll('.circles div');
    back.addEventListener("click", function() {
    inverse(back);
    inverse(b1);
    for (let i = 0; i < allcircles.length; i++) {
        circles(allcircles[i]);
    }
    
    });

    
    b1.addEventListener("click", function() {
        allcircles.forEach((circle,index) => {
            setTimeout(() => {
                circle.classList.toggle('play');
            }, (100*index));
        });
    });
    });

function inverse(HTMLElement) {
    let color = window.getComputedStyle(HTMLElement).backgroundColor;
    if (color === "rgb(255, 255, 255)") {
        HTMLElement.style.background = "black";
    } else if(color === "rgb(0, 0, 0)") {
        HTMLElement.style.background = "white";
    }
}

function circles(HTMLElement) {
    let color = window.getComputedStyle(HTMLElement).borderColor;
    if (color === "rgb(255, 255, 255)") {
        HTMLElement.style.border = "1px solid black";
    } else if(color === "rgb(0, 0, 0)") {
        HTMLElement.style.border = "1px solid white";
    }
    
}
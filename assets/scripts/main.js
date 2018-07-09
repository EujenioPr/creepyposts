window.onload = () => {
    storage();
    fetchData('https://api.myjson.com/bins/152f9j');
}

var posts = [];
var searchPosts = [];
var usedPosts = [];

let select = document.getElementById("dateSelect");
let searchInp = document.getElementById("mainSearch");
let tagSpace = document.getElementById('tagSpace');
let selectedTags = [];

const fetchData = (url) => {
    fetch(url)
        .then(function(res) {
            return res.json()
        })
        .then(function(result) {
            sortArray(result.data, select.value);
            console.log(posts);
        })
}

const sortArray = (array, sortType) => {
    let arr = array;
    arr.sort((a, b) => {
        let x = Date.parse(a.createdAt);
        let y = Date.parse(b.createdAt);
        return sortType == 'oldest' ? x - y : y - x;
    });
    posts.length < 1 ? posts = arr : posts;

    usedPosts = arr;

    loadData(usedPosts);
}

const loadData = (posts_, startIndex) => {
    console.log("loadData -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-");
    
    let ind = startIndex || 0;
    let body = document.getElementById('mainBody');
    if(ind == 0) {
        body.innerHTML = '';
    }
    return new Promise((res, rej) => {
        for(let i = ind; i < (ind + 10); i++) {
            if(i >= posts_.length) { return; }
            body.appendChild(articleCreator(posts_[i]));
        }
        res();
    })
}

var scrollHandler = (function(){
    var allowScroll = true;
    
    function requestLoadData() {
        if(document.documentElement.scrollTop + window.innerHeight >= document.body.scrollHeight) {
            let body = document.getElementById('mainBody');
            let step = Math.floor(body.childNodes.length / 10) * 10;
            console.log(step);
            if(step >= usedPosts.length || usedPosts.length <= 10) { return; }
            
            allowScroll = false;
            
            loadData(usedPosts, step)
            .then(() => {
                allowScroll = true;
            })
        }
    }
    
    return {
        getLoadData: function() {
            if(allowScroll) {
                requestLoadData();
            }
            console.log('scrollHandler', allowScroll);
            return;
        }
    }
})();

window.onscroll = scrollHandler.getLoadData;

select.addEventListener("change", function(e) {
    console.log('changed select');
    clearTagSpace();
    storage(e.target.value);
    sortArray(usedPosts, e.target.value);
});

searchInp.addEventListener("keyup", function(e) {
    console.log(e.target.value);

    searchPosts = posts.filter(function(val) {
        if(val.title.toLowerCase().includes(e.target.value)) {
            return val;
        }
        return;
    });

    clearTagSpace();

    if(searchInp.value.length < 1) {
        sortArray(posts, select.value);
        return;
    } else if(searchInp.value.length > 0) {
        sortArray(searchPosts, select.value);
        return;
    }
});


tagSpace.addEventListener("click", function(e) {
    if(e.target.className !== 'tag-pick' && e.target.className !== 'tag-pick tag-selected')
        return;
        
    searchInp.value = '';
    storage("newest");   

    if(e.target.className === 'tag-pick tag-selected') {
        selectedTags.splice(selectedTags.indexOf(e.target.innerHTML), 1);
        e.target.className = 'tag-pick';
    } else if(e.target.className === 'tag-pick'){
        selectedTags.push(e.target.innerHTML)
        e.target.className += ' tag-selected';
    }

    let array_ = [];
    array_ = [...posts];
    array_.map(function(post) {

        post.priority = 0;
        for(let sTag of selectedTags) {
            if(post.tags.includes(sTag)) {
                post.priority++;
            }
        }
    });
    
    array_.sort((a, b) => { return b.priority - a.priority || Date.parse(b.createdAt) - Date.parse(a.createdAt) });
    console.log(array_);
    usedPosts = [...array_];

    // loadData(selectedTags.length > 0 ? array_ : posts);
    if(selectedTags.length > 0) {
        loadData(usedPosts);
    } else {
        sortArray(posts, storage());
    }
})

const clearTagSpace = () => {
    for(let el of tagSpace.children) {
        el.className = 'tag-pick';
    }
    selectedTags = [];
}

const articleCreator = (post) => {
    // time format
    let date = new Date(post.createdAt);

    let dd = date.getUTCDate();
    (dd < 10) ? dd = '0' + dd : dd;
    let mm = parseInt(date.getUTCMonth()) + 1;
    ( mm < 10 ) ? mm = '0' + mm : mm;
    let yy = date.getFullYear();
    let dateTime = dd + '/' + mm + '/' + yy;

    let clockTime = date.getUTCHours() + ':' + date.getUTCMinutes();

    // article creating
    let article = document.createElement("article");
    article.className = "body-article";
    article.innerHTML = 
        `<div class="ba-left">
            <img src="${post.image}" alt="">
            <span>Posted: <strong>${dateTime} ${clockTime}</strong></span>
        </div>
        <div class="ba-right">
            <a href="javascript:void(0)">${post.title}</a>
            <span>${post.description}</span>
            <div class="ba-right-tags" id="baRightTags">
            </div>
        </div>`;

    // article tags 
    for(let tag in post.tags) {
        let tag_ = document.createElement('strong');
        tag_.className = 'ba-tag'
        tag_.innerHTML = `${post.tags[tag]}`;
        article.querySelector(".ba-right-tags").appendChild(tag_)
    }

    return article;
}

const storage = (sortType) => {
    if(sortType && sortType.length > 0 && (sortType === "oldest" || sortType === "newest")) {
        localStorage.setItem('sortType', sortType);
        select.value = sortType;
    } else {
        let sortType_ = localStorage.getItem('sortType');
        sortType_ === null ? localStorage.setItem('sortType', select.options[0].value) : sortType_;
        return localStorage.getItem('sortType');
    }
}

let beginBtn = document.getElementById('beginBtn');
beginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    document.documentElement.scrollTop = 0;
    let body = document.getElementById('mainBody');
    body.innerHTML = '';
    
    loadData(usedPosts);

});
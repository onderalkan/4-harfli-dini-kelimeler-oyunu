var wordArr, mixedArr, // arrays that hold the original and jumbled letters
    timeLimit = 60 *1000, // in millisec
    timeLeft,
    timeInt,    
    currentTile, // updated when you pickup a tile
    emptySlot; // holds the X position of the empty slot


gsap.timeline() // set initial states
    .set('.app', {width:900, height:'100%', background:'#333', left:'50%', x:'-50%', userSelect:'none'})
    .set('.slot', {width:112, height:112, borderRadius:20, background:'rgba(60,250,60,0.8)', top:50, left:100, x:(i)=>i*118})
    .set('.tile', {width:100, height:100, top:56, left:106, x:(i)=>i*118, color:'rgba(20,10,10,0.8)', fontSize:87, lineHeight:'104px', textAlign:'center'})
    .set('.tileFront', {pointerEvents:'none', width:100, height:100, borderRadius:17, overflow:'hidden', backgroundSize:'cover', backgroundImage:'url(https://assets.codepen.io/721952/tileBg.png)'})
    .set('.tileShade', {pointerEvents:'none', width:100, height:100, backgroundSize:'cover', backgroundImage:'url(https://assets.codepen.io/721952/tileShade.png)', y:2, scale:1.1, opacity:0.8})
    .set('.timeTxt', {left:715, top:200, fontSize:34, opacity:0})
    .set('.timePlus', {left:715, top:240, fontSize:24, opacity:0})
    .set('.playBtn', {left:650, top:200, fontSize:32, lineHeight:'50px', backgroundColor:'rgba(255,255,255,1)', color:'#565656', borderRadius:9, width:150, height:50, textAlign:'center', cursor:'pointer', overflow:'hidden'})
    .set('.playTxt', {width:'100%', userSelect:'none'})
    .set('.correctHead', {left:100, top:200, fontSize:34, opacity:0})
    .set('.correctList', {left:100, top:240, fontSize:24, opacity:0.6})
    .set('#container', {opacity:1})

    
Draggable.create('.tile', {onPress:(t)=>{ pickup(t) }, onDrag:drag, onRelease:drop  }); // make tiles draggable


$('.playBtn').on('click', ()=>{ // event handlers for 'play' button (which becomes 'replay') 
  gsap.timeline({defaults:{duration:0.2}, onComplete:deal})
      .to('.playBtn', {autoAlpha:0}, 0)
      .to('.correctHead, .timeTxt', {opacity:1})
})

$('.playBtn').on('mouseenter', ()=>{ 
  if ( gsap.isTweening('.playTxt') ) return;
  gsap.timeline({defaults:{duration:0.25}})      
      .to('.playTxt', {opacity:0, y:-30, ease:'back.in(4)'})
      .to('.playTxt', {duration:0.001, y:35})
      .to('.playTxt', {opacity:1, y:0, ease:'back.out'})
})


function deal(){
  wordArr = words.splice(gsap.utils.random(0,words.length-1,1), 1).toString().toUpperCase().split('') // pull a random word, convert to upper case, then separate chars into an array
  mixedArr = gsap.utils.shuffle( gsap.utils.shuffle( gsap.utils.shuffle( [...wordArr] ) ) ) // create a second array and triple shuffle its contents

  gsap.timeline()
      .set('.tileFront', {innerHTML:(i)=>mixedArr[i], userSelect:'none'})
      .fromTo('.tile', {x:(i)=>i*118, opacity:0}, {duration:0.1, opacity:1, stagger:0.06, ease:'power1.inOut'}, 0)
      .fromTo('.tile', {y:50, rotation:0.05}, {duration:0.3, y:0, rotation:0, stagger:0.06, ease:'power4.out'}, 0)
      .to('.slot', {duration:0.1, background:'rgba(0,0,0,0.5)'}, 0)
      .call(function(){
	      	for (var i=1; i<=4; i++) Draggable.get('#t'+i).enable(); //enable tile dragging (disabled on correct answer + time-out)
	      	checkAnswer(); //check to see if any tiles are already in the correct slot
  		}, null, 0.4); 

  

  if (timeInt==undefined) { //start timer
    timeLeft = timeLimit; 
    timeInt = setInterval(updateTime, 10);
    
    // clear correct answers (needed for replay)        
    $('.correctN').html( 0 );
    $('.correctList').html( '' );
  }
}


function pickup(t){ // on press, set vars and animate tile lifting up
  currentTile = t.target;
  emptySlot = gsap.getProperty(currentTile, 'x');
  gsap.timeline({defaults:{duration:0.2, overwrite:true, ease:'power3.out'}})
      .to($(currentTile).children('.tileFront')[0], {scale:1.1}, 0)
      .to($(currentTile).children('.tileShade')[0], {y:30, opacity:0.4, scale:1}, 0)
}


function drag(){
  for (var i=1; i<=4; i++){ // loop through all 6 tiles...
    if (currentTile.id.substr(-1)!=String(i)) { // and only hit-test against the other tiles
      var t = '#t'+i;
      if (!gsap.isTweening(t)){ // also, only hit-test when tile is stationary
        if ( Draggable.hitTest(currentTile, t, 30) ) { // if at least 30px are overlapping...
          gsap.timeline()
              .to(t, {duration:0.1, y:()=>gsap.getProperty(currentTile, 'y')<0? 66:-66, ease:'slow(0.7,0.7)', repeat:1, yoyo:true, zIndex:100}, 0)
              .to(t, {duration:0.2, x:emptySlot, ease:'power2.inOut'}, 0); // move tile to empty slot,
          
          emptySlot = gsap.getProperty(t, 'x'); // then update emptySlot
        }
      }
    }
  }
}


function drop(){ // on release, put current tile in the empty slot
  gsap.timeline({defaults:{duration:0.1, overwrite:true, ease:'power1.in'}, onComplete:()=>{ if (timeInt!=undefined) checkAnswer() }})
      .to(currentTile, {x:emptySlot, y:0}, 0)
      .to($(currentTile).children('.tileFront')[0], {scale:1}, 0)
      .to($(currentTile).children('.tileShade')[0], {y:2, opacity:0.8, scale:1.1}, 0)
}


function checkAnswer(){
  var arr = new Array(400); // make an array with enough space to place each char at an index based on each tile's X position
  for (var i=1; i<=4; i++) arr.splice(gsap.getProperty('#t'+i,'x'), 1, $('#t'+i).children('.tileFront').html()); // then populate that array
  
  for (var j=0; j<4; j++){ // turn correct slots green
    if ( wordArr.join('').charAt(j) == arr.join('').charAt(j) ) gsap.to('#s'+(j+1), {duration:0.33, ease:'bounce.out', background:'rgba(60,250,60,0.8)'});
    else gsap.to('#s'+(j+1), {duration:0.3, background:'rgba(0,0,0,0.5)'});
  }

  if (wordArr.join('')==arr.join('')){ // compare original word and current answer by converting arrays to strings
    currentTile = emptySlot = undefined
    for (var i=1; i<=4; i++) Draggable.get('#t'+i).disable(); // disable all tiles

    var n = Number($('.correctN').html());
    $('.correctN').html( n+=1 ); // add to correct number tally
    $('.correctList').append( arr.join('')+'<br>' ); // add to list of correct words

    timeLeft+=3000; // 3-sec bonus
        
    gsap.timeline({onComplete:deal}) // success animation, then deal() new letter tiles
        .to('.timePlus',      {duration:0.1, opacity:1, yoyo:true, repeat:1, repeatDelay:0.4}, 0)
        .fromTo('.timePlus',  {scale:0, rotation:0.1}, {duration:0.3, scale:1, rotation:0, ease:'back.out(3)'}, 0)
        .to('.slot',          {duration:0.2, background:'rgba(0,0,0,0.5)', overwrite:true}, 0)
        .to('.tile',          {duration:0.35, scale:1.16, ease:'back.inOut(7)'}, 0.1)
        .to('.tile',          {duration:0.2, opacity:0, scale:1, ease:'power1.inOut'}, 0.8)
  }
}


function updateTime(){
    if (timeLeft>0){
      timeLeft-=10;
      var mil = Math.floor(timeLeft%1000/10);
      var sec = Math.floor(timeLeft/1000);
      if (mil<10) mil = "0"+mil;
      if (sec<10) sec = "0"+sec;
      var t = sec + ":" + mil;
      gsap.set('.timeTxt', {innerHTML:t});
    }
    
    else { // Game over
      clearInterval(timeInt);
      timeInt = currentTile = emptySlot = undefined;

      for (var i=1; i<=4; i++) Draggable.get('#t'+i).disable(); // disable all tiles
            
      gsap.timeline({defaults:{duration:0.001, overwrite:true}})
          // auto-solve the last word
          .to('.slot', {duration:0.2, ease:'power1.inOut', background:'rgba(60,250,60,0.8)'}, 0)
          .to('.tile', {scale:1, y:0, x:(i)=>i*118}, 0.1)
          .to('.tileFront', {scale:1, innerHTML:(i)=>wordArr[i], userSelect:'none'}, 0.1)
          .to('.tileShade', {y:2, opacity:0.8, scale:1.1}, 0.1)
          // hide timer + display replay button
          .to('.timeTxt', {duration:0.3, opacity:0}, 0)
          .to('.playTxt', {duration:0.3, innerHTML:'Tekrar', userSelect:'none'}, 0)
          .to('.playBtn', {duration:0.3, autoAlpha:1, ease:'power1.inOut'}, 0.3)
    }
}
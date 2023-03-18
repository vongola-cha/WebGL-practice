
// create vertex shader source
let vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert
// attributes, we only have a single attribute
in vec4 a_position;
in vec3 a_color;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
out vec4 v_color;
void main(){
    gl_Position = u_projectionMatrix * u_viewMatrix*a_position;
    v_color=vec4 (a_color,1.0);
}
`;

// create fragment shaders source
let fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag
// set default precision
precision highp float;
in vec4 v_color;
out vec4 outColor;

void main(){
    outColor = v_color;
}
`;

// a function to compile shaders
// call the fragment shader and the vertex shader, and get the obeject from the shaders.
function createShader(gl, type, source){
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

// we need a function to link shaders into a program
function createProgram(gl, vertexShader, fragmentShader){
  let  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
 
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

// ============================= MAIN FUNCTION  =============================
/* main function that execute steps to 
   render a single triangle on the canvas
*/
function initWebGL(){
  // get canvas from DOM (HTML)
  let canvas = document.querySelector("#c");

  /** @type {WebGLRenderingContext} */
  let gl = canvas.getContext('webgl2'); 

  let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
  let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
  let program = createProgram(gl, vertexShader, fragmentShader);

  let positionAttributeLocation = gl.getAttribLocation(program, 'a_position'); 
  let colorAttributeLocation = gl.getAttribLocation(program, 'a_color');
  // ---------------------------- vertices position   ----------------------------
  // create memory buffer for vertex shader and copy/transfer vertices to GPU
  // position
  let positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  triangleVertices = [
    0.5,0.5, 0.5,     0.5, 0.5, 0.5,  // v0 White
    -0.5, 0.5, 0.5,    0.5, 0.0, 0.5,  // v1 Magenta
    -0.5, -0.5, 0.5,   0.5, 0.0, 0.0,  // v2 Red
    0.5, -0.5, 0.5,    0.5, 0.5, 0.0,  // v3 Yellow
    0.5, -0.5, -0.5,   0.0, 0.5, 0.0,  // v4 Green
    0.5, 0.5, -0.5,    0.0, 0.5, 0.5,  // v5 Cyan
    -0.5, 0.5, -0.5,   0.0, 0.0, 0.5,  // v6 Blue
    -0.5, -0.5, -0.5,  0.0, 0.0, 0.0   // v7 Black
  ];

  
  // index
  var indices = [
    0, 1, 2,  0, 2, 3,    // front
    0, 3, 4,  0, 4, 5,    // right
    0, 5, 6,  0, 6, 1,    // up
    1, 6, 7,  1, 7, 2,    // left
    7, 4, 3,  7, 3, 2,    // down
    4, 7, 6,  4, 6, 5     // back
  ];

  // transfer data from cpu to gpu
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  // tell vertex shader how to extract/pull/interpret bytes in buffer
  // look up data address
  gl.enableVertexAttribArray(positionAttributeLocation);  
  // specifically how to interpret bits
  let FSIZE = 4;
  let size = 3; // get/read 3 components per iteration --here means x,y,z  if it is 2, it means x and y.
  let type = gl.FLOAT; // size in bits for each item
  let normalize = false;  // do not normalize data, generally Never
  let stride = 6*FSIZE; // used to skip over bytes when different attributes are stored in buffer (ie position, color)
  let offset = 0;  // location to start reading data from in the buffer
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset); // (a-position,......)

  // ---------------------------- vertices color   ----------------------------
  gl.enableVertexAttribArray(colorAttributeLocation);
  gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, 3*FSIZE);


  let indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
      console.log('Failed to create index buffer');
      return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
  let n=indices.length;

  // tell the GPU which program to use 
  gl.useProgram(program);

  // --------------------------- Projection & View Matrix ---------------------------
  //Projection Matrix
  let projectionMatrix = glMatrix.mat4.create();
  glMatrix.mat4.perspective(projectionMatrix, Math.PI / 6, canvas.width / canvas.height, 0.1, 100);
  let projectionLocation = gl.getUniformLocation(program, "u_projectionMatrix");
  gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
  //View Matrix
  let modelViewMatrix = glMatrix.mat4.create();
  let viewMatrixLocation = gl.getUniformLocation(program, "u_viewMatrix");
  
  function createViewMatrix(){
    // View Matrix
    let eyeX=4;
    let eyeY=4;
    let eyeZ=6;
    //(out, eye, center, up)
    glMatrix.mat4.lookAt(modelViewMatrix, [eyeX, eyeY, eyeZ], [0, 0, 0], [0, 1, 0]);
  }
    
  //-------------------------- Rotation Parameters --------------------------
  //torso
  let torsoSize=1;
  let torsoAngleX=toRadian(0);
  let torsoAngleY=toRadian(0);
  let torsoAngleZ=toRadian(0);
  // head
  let headSize=0.5;
  let headAngleX=toRadian(0);
  let headAngleY=toRadian(0);
  let headAngleZ=toRadian(0);
  // left arm
  let lowerAngleLX=toRadian(0);
  let lowerAngleLY=toRadian(0);
  let lowerAngleLZ=toRadian(-30);
  let upperAngleLX=toRadian(0);
  let upperAngleLY=toRadian(-90);
  let upperAngleLZ=toRadian(0);
  // right arm
  let lowerAngleRX=toRadian(0);
  let lowerAngleRY=toRadian(0);
  let lowerAngleRZ=toRadian(30);
  let upperAngleRX=toRadian(0);
  let upperAngleRY=toRadian(90);
  let upperAngleRZ=toRadian(0);
  // left leg
  let legAngleLX=toRadian(0);
  let legAngleLY=toRadian(0);
  let legAngleLZ=toRadian(0);
  // right leg
  let legAngleRX=toRadian(0);
  let legAngleRY=toRadian(0);
  let legAngleRZ=toRadian(0);
  // ----------------------------- Start Draw --------------------------
  let legLengthScale=1;
  let armLengthScale=1;
  drawRobot();
  
  armsListener();
  torsoListener();
  headListener();
  legListener();
  //size Listener
  sizeListener();
  
  

  function drawRobot(){
    // clear
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //torso
    let bodyMatrix = glMatrix.mat4.create();
    bodyMove(bodyMatrix);
    drawCube(gl,torsoSize,torsoSize,torsoSize,modelViewMatrix,bodyMatrix);
    // head
    drawHead();
    // left arm
    drawArm(1,lowerAngleLX,lowerAngleLY,lowerAngleLZ,upperAngleLX,upperAngleLY,upperAngleLZ); 
    // right arm
    drawArm(-1,lowerAngleRX,lowerAngleRY,lowerAngleRZ,upperAngleRX,upperAngleRY,upperAngleRZ);
    // left leg
    drawLeg(1,legAngleLX,legAngleLY,legAngleLZ);
    // right leg
    drawLeg(-1,legAngleRX,legAngleRY,legAngleRZ);
  }

//============================= Functions of Drawing the Robot=============================

  function bodyMove(matrix){
    glMatrix.mat4.rotate(matrix, matrix, torsoAngleX, [1,0,0,0]);
    glMatrix.mat4.rotate(matrix, matrix, torsoAngleY, [0,1,0,0]);
    glMatrix.mat4.rotate(matrix, matrix, torsoAngleZ, [0,0,1,0]);
    
  }

  function drawHead(){
    let matrix=glMatrix.mat4.create();
    bodyMove(matrix);
    let moveDis=(headSize+torsoSize)/2;
    glMatrix.mat4.translate(matrix, matrix, [0, moveDis, 0]);
    glMatrix.mat4.rotate(matrix, matrix, headAngleX, [1,0,0,0]);
    glMatrix.mat4.rotate(matrix, matrix, headAngleY, [0,1,0,0]);
    glMatrix.mat4.rotate(matrix, matrix, headAngleZ, [0,0,1,0]);
    drawCube(gl,headSize,headSize,headSize,modelViewMatrix,matrix);
  }
  

  // whichArm=1 : left arm
  // whichArm=-1 : right arm
  function drawArm(whichArm,lowerAngleX,lowerAngleY,lowerAngleZ,upperAngleX,upperAngleY,upperAngleZ){
    // ------------------ Lower Arm ------------------
    let armwidth=0.7*armLengthScale;
    let armHight=0.3;
    let armDepth=0.3;
    let matrix = glMatrix.mat4.create();
    // matrix = bodyMatrix;
    bodyMove(matrix);
    moveDis=(armwidth+torsoSize)/2;
    // translate
    glMatrix.mat4.translate(matrix, matrix, [moveDis*whichArm,0 , 0.0]);
    // rotate
    glMatrix.mat4.translate(matrix, matrix, [-armwidth/2*whichArm, 0, 0.0]);
    glMatrix.mat4.rotate(matrix, matrix, lowerAngleX, [1,0,0,0]);
    glMatrix.mat4.rotate(matrix, matrix, lowerAngleY, [0,1,0,0]);
    glMatrix.mat4.rotate(matrix, matrix, lowerAngleZ, [0,0,1,0]);
    glMatrix.mat4.translate(matrix, matrix, [armwidth/2*whichArm, 0, 0.0]);
    drawCube(gl,armwidth,armHight,armDepth,modelViewMatrix,matrix);

    // ------------------ Upper Arm ------------------
    //translation
    glMatrix.mat4.translate(matrix, matrix, [armwidth*whichArm, 0, 0.0]);
    //rotation
    glMatrix.mat4.translate(matrix, matrix, [-armwidth/2*whichArm, 0, 0.0]);
    glMatrix.mat4.rotate(matrix, matrix, upperAngleX, [1,0,0]);
    glMatrix.mat4.rotate(matrix, matrix, upperAngleY, [0,1,0]);
    glMatrix.mat4.rotate(matrix, matrix, upperAngleZ, [0,0,1]);
    glMatrix.mat4.translate(matrix, matrix, [armwidth/2*whichArm, 0, 0.0]);
    drawCube(gl,armwidth,armHight,armDepth,modelViewMatrix,matrix);
  }

  function drawLeg(whichLeg,angleX,angleY,angleZ){
    let legWidth=0.4;
    let legHight=0.8*legLengthScale;
    let lefDepth=0.4;
    let legDis=0.25;
    let matrix = glMatrix.mat4.create();

    bodyMove(matrix);
    moveDis=(legWidth+torsoSize)/2;
    // translate
    glMatrix.mat4.translate(matrix, matrix, [whichLeg*legDis,-moveDis,0.0]);
    // rotate
    glMatrix.mat4.translate(matrix, matrix, [0,legHight/2, 0.0]);
    glMatrix.mat4.rotate(matrix, matrix, angleX, [1,0,0,0]);
    glMatrix.mat4.rotate(matrix, matrix, angleY, [0,1,0,0]);
    glMatrix.mat4.rotate(matrix, matrix, angleZ, [0,0,1,0]);
    glMatrix.mat4.translate(matrix, matrix, [0,-legHight/2, 0.0]);
    drawCube(gl,legWidth,legHight,lefDepth,modelViewMatrix,matrix);
  }

  function drawCube(gl,width,height,depth,modelViewMatrix,matrix) {
    // scale matrix
    let scaleMatrix = glMatrix.mat4.create();
    glMatrix.mat4.scale(scaleMatrix, matrix, [width, height, depth]);
    // view matrix
    createViewMatrix();
    // multiply and send to VS
    glMatrix.mat4.multiply(modelViewMatrix, modelViewMatrix, scaleMatrix);
    gl.uniformMatrix4fv(viewMatrixLocation, false, modelViewMatrix);
    //draw
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

  }

  function toRadian(angle){
    return angle/180*Math.PI;
  }

  //============================= Sliders Listener Functions =============================
  // Arm Listener Slider
  function armsListener(){
    //----------------lower L----------------------
      const lowerLX=document.querySelector("#lowerLX");
      lowerLX.addEventListener("input",()=>{
        lowerAngleLX=toRadian(parseFloat(lowerLX.value));
        drawRobot();
      })
      const lowerLY=document.querySelector("#lowerLY");
      lowerLY.addEventListener("input",()=>{
        lowerAngleLY=toRadian(parseFloat(lowerLY.value));
        drawRobot();
      })
      const lowerLZ=document.querySelector("#lowerLZ");
      lowerLZ.addEventListener("input",()=>{
        lowerAngleLZ=toRadian(parseFloat(lowerLZ.value));
        drawRobot();
      })
      //----------------lower R----------------------
      const lowerRX=document.querySelector("#lowerRX");
      lowerRX.addEventListener("input",()=>{
        lowerAngleRX=toRadian(parseFloat(lowerRX.value));
        drawRobot();
      })
      const lowerRY=document.querySelector("#lowerRY");
      lowerRY.addEventListener("input",()=>{
        lowerAngleRY=toRadian(parseFloat(lowerRY.value));
        drawRobot();
      })
      const lowerRZ=document.querySelector("#lowerRZ");
      lowerRZ.addEventListener("input",()=>{
        lowerAngleRZ=toRadian(parseFloat(lowerRZ.value));
        drawRobot();
      })
      //----------------upper L----------------------
      const upperLX=document.querySelector("#upperLX");
      upperLX.addEventListener("input",()=>{
        upperAngleLX=toRadian(parseFloat(upperLX.value));
        drawRobot();
      })
      const upperLY=document.querySelector("#upperLY");
      upperLY.addEventListener("input",()=>{
        upperAngleLY=toRadian(parseFloat(upperLY.value));
        drawRobot();
      })
      const upperLZ=document.querySelector("#upperLZ");
      upperLZ.addEventListener("input",()=>{
        upperAngleLZ=toRadian(parseFloat(upperLZ.value));
        drawRobot();
      })
      //----------------upper R----------------------
      const upperRX=document.querySelector("#upperRX");
      upperRX.addEventListener("input",()=>{
        upperAngleRX=toRadian(parseFloat(upperRX.value));
        drawRobot();
      })
      const upperRY=document.querySelector("#upperRY");
      upperRY.addEventListener("input",()=>{
        upperAngleRY=toRadian(parseFloat(upperRY.value));
        drawRobot();
      })
      const upperRZ=document.querySelector("#upperRZ");
      upperRZ.addEventListener("input",()=>{
        upperAngleRZ=toRadian(parseFloat(upperRZ.value));
        drawRobot();
      })
    }

    //torso Listener
  function torsoListener(){
    const torsoX=document.querySelector("#torsoX");
    torsoX.addEventListener("input",()=>{
      torsoAngleX=toRadian(parseFloat(torsoX.value));
      drawRobot();
    })
    const torsoY=document.querySelector("#torsoY");
    torsoY.addEventListener("input",()=>{
      torsoAngleY=toRadian(parseFloat(torsoY.value));
      drawRobot();
    })
    const torsoZ=document.querySelector("#torsoZ");
    torsoZ.addEventListener("input",()=>{
      torsoAngleZ=toRadian(parseFloat(torsoZ.value));
      drawRobot();
    })
  }

  //head Listener
  function headListener(){
    const headX=document.querySelector("#headX");
    headX.addEventListener("input",()=>{
      headAngleX=toRadian(parseFloat(headX.value));
      drawRobot();
    })
    const headY=document.querySelector("#headY");
    headY.addEventListener("input",()=>{
      headAngleY=toRadian(parseFloat(headY.value));
      drawRobot();
    })
    const headZ=document.querySelector("#headZ");
    headZ.addEventListener("input",()=>{
      headAngleZ=toRadian(parseFloat(headZ.value));
      drawRobot();
    })
  }

  //leg Listener
  function legListener(){
    //left leg
    const legLX=document.querySelector("#legLX");
    legLX.addEventListener("input",()=>{
      legAngleLX=toRadian(parseFloat(legLX.value));
      drawRobot();
    })
    const legLY=document.querySelector("#legLY");
    legLY.addEventListener("input",()=>{
      legAngleLY=toRadian(parseFloat(legLY.value));
      drawRobot();
    })
    const legLZ=document.querySelector("#legLZ");
    legLZ.addEventListener("input",()=>{
      legAngleLZ=toRadian(parseFloat(legLZ.value));
      drawRobot();
    })
    //right leg
    const legRX=document.querySelector("#legRX");
    legRX.addEventListener("input",()=>{
      legAngleRX=toRadian(parseFloat(legRX.value));
      drawRobot();
    })
    const legRY=document.querySelector("#legRY");
    legRY.addEventListener("input",()=>{
      legAngleRY=toRadian(parseFloat(legRY.value));
      drawRobot();
    })
    const legRZ=document.querySelector("#legRZ");
    legRZ.addEventListener("input",()=>{
      legAngleRZ=toRadian(parseFloat(legRZ.value));
      drawRobot();
    })
    
  }

  function sizeListener(){
    //head
    const headSizeSlider=document.querySelector("#headSize");
    headSizeSlider.addEventListener("input",()=>{
      headSize=parseFloat(headSizeSlider.value);
      drawRobot();
    })
    //torso
    const torsoSizeSlider=document.querySelector("#torsoSize");
    torsoSizeSlider.addEventListener("input",()=>{
      torsoSize=parseFloat(torsoSizeSlider.value);
      drawRobot();
    })
    //arm
    const armLengthSlider=document.querySelector("#armLength");
    armLengthSlider.addEventListener("input",()=>{
      armLengthScale=parseFloat(armLengthSlider.value);
      drawRobot();
    })
    //leg
    const legLengthSlider=document.querySelector("#legLength");
    legLengthSlider.addEventListener("input",()=>{
      legLengthScale=parseFloat(legLengthSlider.value);
      drawRobot();
    })
    
  }
    
}



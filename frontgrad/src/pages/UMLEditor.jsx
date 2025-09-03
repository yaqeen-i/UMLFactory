import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// === CSS-in-JS styles ===
const styless = `
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(120deg, #f0f4f8 0%, #d9e8e6 100%);
    margin: 0;
    min-height: 100vh;
}
#canvas-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow-x: auto;
    overflow-y: auto;
    margin-left: 300px;
    min-height: 700px;
}
#uml-canvas {
    border-radius: 18px;
    left: 10px;
    border: 2px solid #4caf93;
    background: #ffffff;
    margin: 0 auto;
    display: inline-block;
    box-shadow: 0 8px 32px rgba(76, 175, 147, 0.13);
}
#toolbar {
    position: fixed;
    top: 70px;
    left: 0;
    width: 220px;
    background: #f9fafb;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 2rem 1rem 1.5rem 1rem;
    gap: 2rem;
    z-index: 10;
    border-top-right-radius: 0;
    border-bottom-right-radius: 1.2rem;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
    border: 1.5px solid #e0e0e0;
    max-height: 90vh;
    overflow-y: auto;
    border-radius:0; /* Set square edges for the toolbar */
}
#toolbar.toolbar-visible {
    left: 10px;
}
#toolbar-hotspot {
    position: fixed;
    top: 0;
    left: 0;
    width: 18px;
    height: 100vh;
    z-index: 11;
    background: transparent;
}
.toolbar-group {
    display: flex;
    flex-direction: column;
    gap: 7px;
    align-items: stretch;
}
.toolbar-label {
    font-size: 13px;
    color: #2c3e50;
    font-weight: bold;
    letter-spacing: 0.02em;
    margin-bottom: 4px;
    margin-top: 2px;
    text-align: center;
}
.toolbar-btn-generate {
    font-size: 15px;
    background: #4caf93;
    color: #fff;
    border: none;
    border-radius: 7px;
    padding: 6px 10px;
    margin: 0;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, box-shadow 0.15s;
    box-shadow: 0 1.5px 5px rgba(76, 175, 147, 0.2);
    outline: none;
}
.toolbar-btn {
    font-size: 15px;
    background: linear-gradient(90deg, #4caf93 70%, #81c7b8 100%);
    color: #fff;
    border: none;
    border-radius: 7px;
    padding: 6px 10px;
    margin: 0;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, box-shadow 0.15s;
    box-shadow: 0 1.5px 5px rgba(76, 175, 147, 0.2);
    outline: none;
}
.toolbar-btn:active, .toolbar-btn:focus {
    background: #81c7b8;
    color: #2c3e50;
}
.toolbar-btn:hover {
    background: #81c7b8;
    color: #2c3e50;
}
.export-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
}
#uml-modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0; top: 0;
    width: 100vw; height: 100vh;
    background: rgba(16,185,129,0.13);
}
#uml-modal-content {
    background: #fff;
    margin: 12% auto;
    padding: 24px 32px 22px 32px;
    border-radius: 12px;
    box-shadow: 0 8px 32px #2dd4bf33;
    width: 340px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}
#uml-modal input[type="text"] {
    width: 100%;
    font-size: 17px;
    padding: 7px 8px;
    margin-bottom: 8px;
    border-radius: 6px;
    border: 1.5px solidrgb(160, 218, 206);
    background: #e0fdfa;
}
#uml-modal button {
    margin-right: 9px;
    padding: 7px 18px;
    border: none;
    border-radius: 7px;
    font-size: 15px;
    cursor: pointer;
    background: #2dd4bf33;
    color: #fff;
    font-weight: 500;
}
#uml-modal button.secondary {
    background: #bbb;
    color: #fff;
}
#relation-mode-label {
    display: flex; align-items: center; gap: 4px;
    font-size: 15px;
    user-select: none;
}
#relation-type {
    font-size: 15px;
    padding: 2px 4px;
    border-radius: 6px;
    border: 1.2px solid #e0fdfa;
    margin-top: 5px;
    background: #e0fdfa;
    color: #047857;
}
.toolbar-tip {
    font-size: 12px;
    color: #047857;
    border-radius: 6px;
    padding: 5px 8px 3px 8px;
    background: #d1fae5;
    margin-top: 7px;
    text-align: center;
}
.visibility-select {
    width: 100%;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1.5px solid #d1fae5;
    background: #e0fdfa;
    font-size: 14px;
    color: #047857;
}
.visibility-select option {
    padding: 4px;
}`;
const styles = {
  container: {
    display: 'flex', // Add flex display
    flexDirection: 'row', // Arrange children in a row
    position: 'relative',
    width: '100vw',
    height: '100vh',
    background: '#f5faff',
    overflow: 'hidden',
  },
  canvas: {
    
    border: '1.5px solid #3347b0',
    borderRadius: 10,
    background: '#fff',
    boxShadow: '0 4px 24px #4668D933',
    flex: 1,
    margin: 20,
    marginLeft: 0,
  },
  toolbar: {
    width: 260,
    height: '100%',
    background: '#fff',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowY: 'auto',
    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  button: {
    background: '#a7f3d0', // Fixed syntax by wrapping the color value in quotes
    color: '#065f46',
    padding: '7px 18px',
    border: 'none',
    borderRadius: 7,
    fontSize: 15,
    cursor: 'pointer',
    fontWeight: 500,
    marginBottom: 4,
  },
  modalOverlay: {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(28,38,68,0.13)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    padding: '24px 32px 22px 32px',
    borderRadius: 12,
    boxShadow: '0 8px 32px #4668D933',
    width: 540,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  input: {
    fontSize: 16,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1.5px solid  #a7f3d0',
    background: '#eef2fd',
    marginBottom: 8,
  },
};

const UmlEditor = forwardRef(({ projectId, initialModel, permission }, ref) => {

  // === State ===
  const canvasRef = useRef(null);
  const [classes, setClasses] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [modal, setModal] = useState({ open: false, title: '', value: '', callback: null, withVisibility: false, currentVisibility: 'public' });
  const [relationMode, setRelationMode] = useState(false);
  const [pendingRelation, setPendingRelation] = useState({ fromId: null, type: 'association' });
  const [hoveredShape, setHoveredShape] = useState(null);

  // Drag state
  const [dragTarget, setDragTarget] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resize state
  const [resizeTarget, setResizeTarget] = useState(null);
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 });
  const resizeHandleSize = 14;

  const [zoom, setZoom] = useState(1.0);

  const wsClientRef = useRef(null);

  // === WebSocket setup ===
  useEffect(() => {
    if (!projectId) return;
    // eslint-disable-next-line no-constant-binary-expression
    const socket = new SockJS('http://localhost:9000/ws' || 'http://localhost:5000/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });
    wsClientRef.current = client;
    client.onConnect = () => {
      console.log('STOMP connected');
      client.subscribe(`/topic/uml-project-${projectId}`, (message) => {
        const action = JSON.parse(message.body);
        if (action.type === 'add') {
          if (action.elementType === 'class') {
            setClasses(prev => [...prev, action.payload]);
          } else if (action.elementType === 'relationship') {
            setRelationships(prev => [...prev, action.payload]);
          }
        } else if (action.type === 'delete') {
          if (action.elementType === 'class') {
            setClasses(prev => prev.filter(c => c.id !== action.payload.id));
            setRelationships(prev => prev.filter(r => r.fromId !== action.payload.id && r.toId !== action.payload.id));
          } else if (action.elementType === 'relationship') {
            setRelationships(prev => prev.filter(r => r.id !== action.payload.id));
          } else if (action.elementType === 'canvas') {
            setClasses([]);
            setRelationships([]);
          }
        } else if (action.type === 'update') {
          if (action.elementType === 'class') {
            setClasses(prev => prev.map(c => c.id === action.payload.id ? { ...c, ...action.payload} : c));
          } else if (action.elementType === 'relationship') {
            setRelationships(prev => prev.map(r => r.id === action.payload.id ? action.payload : r));
          }
        }
      });
    };
    client.onStompError = (frame) => {
      console.error('Broker reported error:', frame.headers['message'], frame.body);
    };
    client.onWebSocketError = (event) => {
      console.error('WebSocket error:', event);
    };
    client.activate();
    return () => client.deactivate();
  }, [projectId]);

      // Log when ref is set
    useImperativeHandle(ref, () => ({
        get classes() {
            return classes;
        },
        get relationships() {
            return relationships;
        },
        setModel(newClasses, newRelationships) {
            setClasses(Array.isArray(newClasses) ? newClasses : []);
            setRelationships(Array.isArray(newRelationships) ? newRelationships : []);
        },
        zoomIn() {
            setZoom(z => Math.min(z * 1.1, 3.0));
        },
        zoomOut() {
            setZoom(z => Math.max(z / 1.1, 0.2));
        },
        clearCanvas() {
            setClasses([]);
            setRelationships([]);
            if (projectId) {
                sendUmlAction({
                    type: 'delete',
                    elementType: 'canvas',
                    payload: { classes: [], relationships: [] },
                    projectId,
                });
            }
        }
    }), [classes, relationships, projectId]);

    // When initialModel changes, set the model in the editor
    useEffect(() => {
        if (initialModel) {
            setClasses(initialModel.classes || []);
            setRelationships(initialModel.relationships || []);
        }
    }, [initialModel]);

  // Helper to send UML actions
  const sendUmlAction = (action) => {
    if (wsClientRef.current && wsClientRef.current.connected) {
      wsClientRef.current.publish({
        destination: '/app/uml.action',
        body: JSON.stringify(action),
      });
    } else {
      console.warn('WebSocket not connected, cannot send:', action);
    }
  };

  function handleCanvasMouseDown(e) {
    if (!canEdit) return;
    if (relationMode) return; // Don't drag in relation mode
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Check resize handle first
    for (let i = classes.length - 1; i >= 0; i--) {
      const obj = classes[i];
      if (
          mx >= obj.x + (obj.width || 60) - resizeHandleSize &&
          mx <= obj.x + (obj.width || 60) &&
          my >= obj.y + (obj.height || 100) - resizeHandleSize &&
          my <= obj.y + (obj.height || 100)
      ) {
        setResizeTarget(obj.id);
        setResizeOffset({ x: obj.x + (obj.width || 60) - mx, y: obj.y + (obj.height || 100) - my });
        return;
      }
    }
    // Find topmost element under mouse
    for (let i = classes.length - 1; i >= 0; i--) {
      const obj = classes[i];
      if (
          mx >= obj.x && mx <= obj.x + (obj.width || 60) &&
          my >= obj.y && my <= obj.y + (obj.height || 100)
      ) {
        setDragTarget(obj.id);
        setDragOffset({ x: mx - obj.x, y: my - obj.y });
        return;
      }
    }
  }

  // Hover logic: track which element is hovered
  function handleCanvasMouseMove(e) {
    if (!canEdit) return;
    let rect = canvasRef.current.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    // Hover detection
    let found = null;
    for (let i = classes.length - 1; i >= 0; i--) {
      const obj = classes[i];
      if (
          mx >= obj.x && mx <= obj.x + (obj.width || 60) &&
          my >= obj.y && my <= obj.y + (obj.height || 100)
      ) {
        found = obj.id;
        break;
      }
    }
    setHoveredShape(found);
    if (resizeTarget) {
      setClasses(prev => prev.map(obj => {
        if (obj.id !== resizeTarget) return obj;
        // Minimum sizes for each type
        const minW = obj.type === 'class' ? 120 : 40;
        const minH = obj.type === 'class' ? 90 : 40;
        let newW = Math.max(minW, mx - obj.x + resizeOffset.x);
        let newH = Math.max(minH, my - obj.y + resizeOffset.y);
        return { ...obj, width: newW, height: newH };
      }));
      return;
    }
    if (!dragTarget) return;
    rect = canvasRef.current.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    setClasses(prev => prev.map(obj =>
        obj.id === dragTarget
            ? { ...obj, x: mx - dragOffset.x, y: my - dragOffset.y }
            : obj
    ));
  }

  function handleCanvasMouseUp() {
    if (!canEdit) return;
    if (dragTarget !== null) {
      const obj = classes.find(c => c.id === dragTarget);
      if (obj && projectId) {
        sendUmlAction({
          type: 'update',
          elementType: 'class',
          payload: { id: obj.id, x: obj.x, y: obj.y }, // Only send id and new position
          projectId,
        });
      }
    }
    if (resizeTarget !== null) {
      const obj = classes.find(c => c.id === resizeTarget);
      if (obj && projectId) {
        sendUmlAction({
          type: 'update',
          elementType: 'class',
          payload: { id: obj.id, x: obj.x, y: obj.y, width: obj.width, height: obj.height }, // Only send id and new size/position
          projectId,
        });
      }
    }
    setDragTarget(null);
    setResizeTarget(null);
  }

  // Track hovered element for icon display
  function handleCanvasMouseMoveHover(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found = null;
    for (let i = classes.length - 1; i >= 0; i--) {
      const obj = classes[i];
      if (
          mx >= obj.x && mx <= obj.x + (obj.width || 60) &&
          my >= obj.y && my <= obj.y + (obj.height || 100)
      ) {
        found = obj.id;
        break;
      }
    }
    setHoveredShape(found);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousemove', handleCanvasMouseMoveHover);
    return () => {
      canvas.removeEventListener('mousemove', handleCanvasMouseMoveHover);
    };
  }, [classes]);

  // Attach mouse event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    window.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    return () => {
      canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  });

  // === Modal logic ===
  const showModal = (title, value, callback, withVisibility = false, currentVisibility = 'public') => {
    setModal({ open: true, title, value, callback, withVisibility, currentVisibility });
  };
  const closeModal = () => setModal(m => ({ ...m, open: false, callback: null }));

  // === Drawing helpers ===
  function drawGrid(ctx, width, height, gridSize = 25) {
    ctx.save();
    ctx.strokeStyle = '#e3e8f7';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEditIcon(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = "#47b0d9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 14);
    ctx.lineTo(x + 10, y + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 3);
    ctx.lineTo(x + 11, y + 5);
    ctx.lineTo(x + 1, y + 15);
    ctx.lineTo(x - 1, y + 13);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  function drawDeleteIcon(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = "#f06d6d";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + 10, y + 14);
    ctx.moveTo(x + 10, y + 4);
    ctx.lineTo(x, y + 14);
    ctx.stroke();
    ctx.restore();
  }

  function drawResizeHandle(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "#3347b0";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x + w - resizeHandleSize, y + h - resizeHandleSize, resizeHandleSize, resizeHandleSize);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Draws a visible hitbox boundary for icon
  function drawIconHitbox(ctx, x, y, w = 18, h = 18) {
    x-=3.8;
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = '#4668D9';
    ctx.strokeStyle = '#3347b0';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 7);
    else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.globalAlpha = 0.15;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Helper to get name and icon position for any element type
  function getNameAndIconPosition(ctx, obj) {
    let nameX, nameY, nameWidth, align = 'left';
    if (obj.type === 'class') {
      ctx.font = "bold 18px Segoe UI, Arial";
      nameX = obj.x + 16;
      nameY = obj.y + 10;
      nameWidth = ctx.measureText(obj.name).width;
      align = 'left';
    } else if (obj.type === 'actor') {
      ctx.font = '15px Segoe UI';
      nameWidth = ctx.measureText(obj.name).width;
      nameX = obj.x + obj.width / 2;
      nameY = obj.y + obj.height + 18;
      align = 'center';
    } else if (obj.type === 'usecase') {
      ctx.font = '15px Segoe UI';
      nameWidth = ctx.measureText(obj.name).width;
      nameX = obj.x + obj.width / 2;
      nameY = obj.y + obj.height / 2 + 5;
      align = 'center';
    } else if (obj.type === 'system') {
      ctx.font = 'bold 16px Segoe UI';
      nameWidth = ctx.measureText(obj.name).width;
      nameX = obj.x + 10;
      nameY = obj.y + 20;
      align = 'left';
    } else if (obj.type === 'action') {
      ctx.font = '16px Segoe UI';
      nameWidth = ctx.measureText(obj.name).width;
      nameX = obj.x + obj.width / 2;
      nameY = obj.y + obj.height / 2;
      align = 'center';
    } else if ([
      'node', 'artifact', 'device', 'component', 'interface', 'port','flow_startend','flow_decision','flow_io','flow_process'
    ].includes(obj.type)) {
      ctx.font = 'bold 15px Segoe UI';
      nameWidth = ctx.measureText(obj.name).width;
      nameX = obj.x + obj.width / 2;
      nameY = obj.y + obj.height / 2 + 4;
      align = 'center';
    }
    return { nameX, nameY, nameWidth, align };
  }

  function drawClass(ctx, cls) {
    ctx.save();
    ctx.shadowColor = "#aac4e2";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#f5faff";
    ctx.fillRect(cls.x, cls.y, cls.width, cls.height);
    ctx.restore();
    ctx.strokeStyle = "#3347b0";
    ctx.lineWidth = 2;
    ctx.strokeRect(cls.x, cls.y, cls.width, cls.height);
    ctx.fillStyle = "#4668D9";
    ctx.fillRect(cls.x, cls.y, cls.width, 38);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Segoe UI, Arial";
    ctx.textBaseline = "top";
    ctx.fillText(cls.name, cls.x + 16, cls.y + 10);
    // Class name edit/delete icons
    if (hoveredShape === cls.id) {
      drawIconHitbox(ctx, cls.x + cls.width - 30, cls.y + 10);
      drawEditIcon(ctx, cls.x + cls.width - 30, cls.y + 10);
      drawIconHitbox(ctx, cls.x + cls.width - 52, cls.y + 10);
      drawDeleteIcon(ctx, cls.x + cls.width - 52, cls.y + 10);
    }
    ctx.font = "16px Segoe UI";
    ctx.fillStyle = "#3347b0";
    ctx.textBaseline = "alphabetic";
    // Attributes
    let attrY = cls.y + 44;
    cls.attributes.forEach((attr) => {
      const visibilitySymbol = {
        public: '+', private: '-', protected: '#', package: '~'
      }[attr.visibility] || '+';
      ctx.fillText(`${visibilitySymbol} ${attr.name}`, cls.x + 18, attrY + 12);
      if (hoveredShape === cls.id) {
        drawIconHitbox(ctx, cls.x + cls.width - 52, attrY + 2);
        drawEditIcon(ctx, cls.x + cls.width - 52, attrY + 2);
        drawIconHitbox(ctx, cls.x + cls.width - 30, attrY + 2);
        drawDeleteIcon(ctx, cls.x + cls.width - 30, attrY + 2);
      }
      attrY += 24;
    });
    ctx.font = "bold 15px Segoe UI";
    ctx.fillStyle = "#7ea6ff";
    ctx.fillText("+ Attribute", cls.x + 18, attrY + 8);
    let methodSectionY = attrY + 20;
    ctx.beginPath();
    ctx.moveTo(cls.x, methodSectionY - 6);
    ctx.lineTo(cls.x + cls.width, methodSectionY - 6);
    ctx.strokeStyle = "#3347b0";
    ctx.stroke();
    let methodY = methodSectionY;
    ctx.font = "italic 15px Segoe UI";
    ctx.fillStyle = "#3d3d3d";
    cls.methods.forEach((method) => {
      const visibilitySymbol = {
        public: '+', private: '-', protected: '#', package: '~'
      }[method.visibility] || '+';
      ctx.fillText(`${visibilitySymbol} ${method.name}`, cls.x + 18, methodY + 12);
      if (hoveredShape === cls.id) {
        drawIconHitbox(ctx, cls.x + cls.width - 52, methodY + 2);
        drawEditIcon(ctx, cls.x + cls.width - 52, methodY + 2);
        drawIconHitbox(ctx, cls.x + cls.width - 30, methodY + 2);
        drawDeleteIcon(ctx, cls.x + cls.width - 30, methodY + 2);
      }
      methodY += 24;
    });
    ctx.font = "bold 15px Segoe UI";
    ctx.fillStyle = "#7ea6ff";
    ctx.fillText("+ Method", cls.x + 18, methodY + 8);
    if (hoveredShape === cls.id) {
      drawResizeHandle(ctx, cls.x, cls.y, cls.width, cls.height);
    }
  }

  function drawActor(ctx, actor) {
    ctx.save();
    ctx.strokeStyle = '#3347b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Head
    ctx.arc(actor.x + actor.width / 2, actor.y + 18, 14, 0, 2 * Math.PI);
    ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(actor.x + actor.width / 2, actor.y + 32);
    ctx.lineTo(actor.x + actor.width / 2, actor.y + 60);
    ctx.stroke();
    // Arms
    ctx.beginPath();
    ctx.moveTo(actor.x + actor.width / 2 - 16, actor.y + 40);
    ctx.lineTo(actor.x + actor.width / 2 + 16, actor.y + 40);
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(actor.x + actor.width / 2, actor.y + 60);
    ctx.lineTo(actor.x + actor.width / 2 - 14, actor.y + actor.height);
    ctx.moveTo(actor.x + actor.width / 2, actor.y + 60);
    ctx.lineTo(actor.x + actor.width / 2 + 14, actor.y + actor.height);
    ctx.stroke();
    // Name
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, actor);
    ctx.textAlign = align;
    ctx.fillStyle = '#3347b0';
    ctx.fillText(actor.name, nameX, nameY);
    if (hoveredShape === actor.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    ctx.restore();
  }
  function drawUseCase(ctx, usecase) {
    ctx.save();
    ctx.strokeStyle = '#4668D9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(
        usecase.x + usecase.width / 2,
        usecase.y + usecase.height / 2,
        usecase.width / 2, usecase.height / 2,
        0, 0, 2 * Math.PI
    );
    ctx.stroke();
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, usecase);
    ctx.textAlign = align;
    ctx.fillStyle = '#4668D9';
    ctx.fillText(usecase.name, nameX, nameY);
    if (hoveredShape === usecase.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    ctx.restore();
    if (hoveredShape === usecase.id) {
      drawResizeHandle(ctx, usecase.x, usecase.y, usecase.width, usecase.height);
    }
  }
  function drawSystemBoundary(ctx, system) {
    ctx.save();
    ctx.strokeStyle = '#6a7bb8';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(system.x, system.y, system.width, system.height);
    ctx.setLineDash([]);
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, system);
    ctx.textAlign = align;
    ctx.fillStyle = '#6a7bb8';
    ctx.fillText(system.name, nameX, nameY);
    if (hoveredShape === system.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    ctx.restore();
    if (hoveredShape === system.id) {
      drawResizeHandle(ctx, system.x, system.y, system.width, system.height);
    }
  }

  function drawActionNode(ctx, node) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(node.x + 14, node.y);
    ctx.lineTo(node.x + node.width - 14, node.y);
    ctx.quadraticCurveTo(node.x + node.width, node.y, node.x + node.width, node.y + 14);
    ctx.lineTo(node.x + node.width, node.y + node.height - 14);
    ctx.quadraticCurveTo(node.x + node.width, node.y + node.height, node.x + node.width - 14, node.y + node.height);
    ctx.lineTo(node.x + 14, node.y + node.height);
    ctx.quadraticCurveTo(node.x, node.y + node.height, node.x, node.y + node.height - 14);
    ctx.lineTo(node.x, node.y + 14);
    ctx.quadraticCurveTo(node.x, node.y, node.x + 14, node.y);
    ctx.closePath();
    ctx.fillStyle = '#e3f2fd';
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, node);
    ctx.textAlign = align;
    ctx.fillStyle = '#1976d2';
    ctx.fillText(node.name, nameX, nameY);
    if (hoveredShape === node.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    ctx.restore();
    if (hoveredShape === node.id) {
      drawResizeHandle(ctx, node.x, node.y, node.width, node.height);
    }
  }
  function drawInitialNode(ctx, node) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x + node.width/2, node.y + node.height/2, node.width/2, 0, 2 * Math.PI);
    ctx.fillStyle = '#2d2d2d';
    ctx.fill();
    ctx.restore();
  }
  function drawFinalNode(ctx, node) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x + node.width/2, node.y + node.height/2, node.width/2, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(node.x + node.width/2, node.y + node.height/2, node.width/2 - 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#2d2d2d';
    ctx.fill();
    ctx.restore();
  }
  function drawForkNode(ctx, node) {
    ctx.save();
    ctx.beginPath();
    if (node.orientation === 'horizontal') {
      ctx.rect(node.x, node.y + node.height/2 - 6, node.width, 12);
    } else {
      ctx.rect(node.x + node.width/2 - 6, node.y, 12, node.height);
    }
    ctx.fillStyle = '#21213a';
    ctx.fill();
    ctx.restore();
  }
  function drawDecisionNode(ctx, node) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(node.x + node.width/2, node.y);
    ctx.lineTo(node.x + node.width, node.y + node.height/2);
    ctx.lineTo(node.x + node.width/2, node.y + node.height);
    ctx.lineTo(node.x, node.y + node.height/2);
    ctx.closePath();
    ctx.fillStyle = '#fffde7';
    ctx.strokeStyle = '#d1b900';
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawNodeElement(ctx, node) {
    // Main rectangle
    ctx.save();
    ctx.strokeStyle = '#4e7d4e';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#eafbe7';
    ctx.beginPath();
    ctx.rect(node.x, node.y, node.width, node.height);
    ctx.fill();
    ctx.stroke();
    // 3D top face
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(node.x + 15, node.y - 12);
    ctx.lineTo(node.x + node.width + 15, node.y - 12);
    ctx.lineTo(node.x + node.width, node.y);
    ctx.closePath();
    ctx.fillStyle = '#d2f5c7';
    ctx.fill();
    ctx.stroke();
    // 3D right face
    ctx.beginPath();
    ctx.moveTo(node.x + node.width, node.y);
    ctx.lineTo(node.x + node.width + 15, node.y - 12);
    ctx.lineTo(node.x + node.width + 15, node.y + node.height - 12);
    ctx.lineTo(node.x + node.width, node.y + node.height);
    ctx.closePath();
    ctx.fillStyle = '#c0e6b0';
    ctx.fill();
    ctx.stroke();
    // Name
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, node);
    ctx.textAlign = align;
    ctx.fillStyle = '#4e7d4e';
    ctx.fillText(node.name, nameX, nameY);
    if (hoveredShape === node.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    ctx.restore();
    if (hoveredShape === node.id) {
      drawResizeHandle(ctx, node.x, node.y, node.width, node.height);
    }
  }
  function drawArtifactElement(ctx, artifact) {
    ctx.save();
    ctx.strokeStyle = '#b06a2c';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff6e3';
    ctx.beginPath();
    ctx.rect(artifact.x, artifact.y, artifact.width, artifact.height);
    ctx.fill();
    ctx.stroke();
    // folded corner
    ctx.beginPath();
    ctx.moveTo(artifact.x + artifact.width - 18, artifact.y);
    ctx.lineTo(artifact.x + artifact.width, artifact.y + 18);
    ctx.lineTo(artifact.x + artifact.width, artifact.y);
    ctx.closePath();
    ctx.fillStyle = "#ffe6b8";
    ctx.fill();
    ctx.stroke();
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, artifact);
    ctx.textAlign = align;
    ctx.fillStyle = '#b06a2c';
    ctx.fillText(artifact.name, nameX, nameY);
    if (hoveredShape === artifact.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    ctx.restore();
    if (hoveredShape === artifact.id) {
      drawResizeHandle(ctx, artifact.x, artifact.y, artifact.width, artifact.height);
    }
  }
  function drawDeviceElement(ctx, device) {
    ctx.save();
    ctx.strokeStyle = "#2c6ab0";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#e3f0ff";
    roundRect(ctx, device.x, device.y, device.width, device.height, 16, true, true);
    // Antenna
    ctx.beginPath();
    ctx.moveTo(device.x + device.width / 2, device.y);
    ctx.lineTo(device.x + device.width / 2, device.y - 18);
    ctx.strokeStyle = "#2c6ab0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(device.x + device.width / 2, device.y - 18, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#2c6ab0";
    ctx.fill();
    ctx.font = "bold 14px Segoe UI";
    ctx.fillStyle = "#2c6ab0";
    ctx.textAlign = "center";
    ctx.fillText(device.name, device.x + device.width / 2, device.y + device.height / 2 + 3);
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, device);
    ctx.textAlign = align;
    ctx.fillStyle = '#2c6ab0';
    ctx.fillText(device.name, nameX, nameY);
    if (hoveredShape === device.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    ctx.restore();
    if (hoveredShape === device.id) {
      drawResizeHandle(ctx, device.x, device.y, device.width, device.height);
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function drawComponentElement(ctx,component) {
    ctx.save();
    ctx.strokeStyle = "#b04e2c";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.rect(component.x, component.y, component.width, component.height);
    ctx.fill();
    ctx.stroke();
    // Draw lollipop symbols (provided and required interfaces)
    // Left side
    for (let i = 0; i < 2; i++) {
      let cy = component.y + 18 + i * 24;
      ctx.beginPath();
      ctx.arc(component.x - 10, cy, 7, 0, 2 * Math.PI);
      ctx.strokeStyle = "#b04e2c";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(component.x, cy);
      ctx.lineTo(component.x - 3, cy);
      ctx.stroke();
    }
    // Stereotype
    ctx.font = "12px Segoe UI";
    ctx.fillStyle = "#b04e2c";
    ctx.textAlign = "center";
    ctx.fillText("<<component>>", component.x + component.width / 2, component.y + 18);
    // Name
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, component);
    ctx.textAlign = align;
    ctx.fillStyle = '#b04e2c';
    ctx.fillText(component.name, nameX, nameY);
    if (hoveredShape === component.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    drawResizeHandle(ctx,component.x, component.y, component.width, component.height);
    ctx.restore();
  }
  function drawInterfaceElement(ctx, element) {
    ctx.save();
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(element.x + element.width/2, element.y + element.height/2, element.width/2, element.height/2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'italic 13px Segoe UI';
    ctx.fillStyle = '#1976d2';
    ctx.textAlign = 'center';
    ctx.fillText('<<interface>>', element.x + element.width/2, element.y + 12);
    ctx.font = 'bold 13px Segoe UI';
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, element);
    ctx.textAlign = align;
    ctx.fillText(element.name, nameX, nameY);
    if (hoveredShape === element.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    ctx.restore();
    if (hoveredShape === element.id) {
      drawResizeHandle(ctx, element.x, element.y, element.width, element.height);
    }
  }
  function drawPortElement(ctx, element) {
    ctx.save();
    ctx.strokeStyle = '#b04e2c';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(element.x + element.width/2, element.y + element.height/2, element.width/2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, element);
    ctx.textAlign = align;
    ctx.fillStyle = '#b04e2c';
    ctx.fillText(element.name, nameX, nameY);
    if (hoveredShape === element.id) {
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      drawIconHitbox(ctx, iconBaseX + 8, nameY - 12);
      drawEditIcon(ctx, iconBaseX + 8, nameY - 12);
      drawIconHitbox(ctx, iconBaseX + 32, nameY - 12);
      drawDeleteIcon(ctx, iconBaseX + 32, nameY - 12);
    }
    ctx.restore();
    if (hoveredShape === element.id) {
      drawResizeHandle(ctx, element.x, element.y, element.width, element.height);
    }
  }

  // === Flowchart Elements ===


  function drawFlowStartEnd(ctx, obj) {
    ctx.save();
    ctx.strokeStyle = '#2fa84f';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#eaffea';
    ctx.beginPath();
    ctx.ellipse(obj.x + obj.width/2, obj.y + obj.height/2, obj.width/2, obj.height/2, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 15px Segoe UI';
    ctx.fillStyle = '#2fa84f';
    ctx.textAlign = 'center';
    ctx.fillText(obj.name, obj.x + obj.width/2, obj.y + obj.height/2 + 5);
    if (hoveredShape === obj.id) {
      // Show edit and delete icons at top right
      drawIconHitbox(ctx, obj.x + obj.width - 30, obj.y + 10);
      drawEditIcon(ctx, obj.x + obj.width - 30, obj.y + 10);
      drawIconHitbox(ctx, obj.x + obj.width - 52, obj.y + 10);
      drawDeleteIcon(ctx, obj.x + obj.width - 52, obj.y + 10);
      drawResizeHandle(ctx, obj.x, obj.y, obj.width, obj.height);
    }
    ctx.restore();
  }
  function drawFlowProcess(ctx, obj) {
    ctx.save();
    ctx.strokeStyle = '#4668D9';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#eaf0ff';
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    ctx.font = 'bold 15px Segoe UI';
    ctx.fillStyle = '#4668D9';
    ctx.textAlign = 'center';
    ctx.fillText(obj.name, obj.x + obj.width/2, obj.y + obj.height/2 + 5);
    if (hoveredShape === obj.id) {
      drawIconHitbox(ctx, obj.x + obj.width - 30, obj.y + 10);
      drawEditIcon(ctx, obj.x + obj.width - 30, obj.y + 10);
      drawIconHitbox(ctx, obj.x + obj.width - 52, obj.y + 10);
      drawDeleteIcon(ctx, obj.x + obj.width - 52, obj.y + 10);
      drawResizeHandle(ctx, obj.x, obj.y, obj.width, obj.height);
    }
    ctx.restore();
  }
  function drawFlowDecision(ctx, obj) {
    ctx.save();
    ctx.strokeStyle = '#b06a2c';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fffbe6';
    ctx.beginPath();
    ctx.moveTo(obj.x + obj.width/2, obj.y);
    ctx.lineTo(obj.x + obj.width, obj.y + obj.height/2);
    ctx.lineTo(obj.x + obj.width/2, obj.y + obj.height);
    ctx.lineTo(obj.x, obj.y + obj.height/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 15px Segoe UI';
    ctx.fillStyle = '#b06a2c';
    ctx.textAlign = 'center';
    ctx.fillText(obj.name, obj.x + obj.width/2, obj.y + obj.height/2 + 5);
    if (hoveredShape === obj.id) {
      drawIconHitbox(ctx, obj.x + obj.width - 30, obj.y + 10);
      drawEditIcon(ctx, obj.x + obj.width - 30, obj.y + 10);
      drawIconHitbox(ctx, obj.x + obj.width - 52, obj.y + 10);
      drawDeleteIcon(ctx, obj.x + obj.width - 52, obj.y + 10);
      drawResizeHandle(ctx, obj.x, obj.y, obj.width, obj.height);
    }
    ctx.restore();
  }
  function drawFlowInputOutput(ctx, obj) {
    ctx.save();
    ctx.strokeStyle = '#348983';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#e0fdfa';
    ctx.beginPath();
    ctx.moveTo(obj.x + 18, obj.y);
    ctx.lineTo(obj.x + obj.width, obj.y);
    ctx.lineTo(obj.x + obj.width - 18, obj.y + obj.height);
    ctx.lineTo(obj.x, obj.y + obj.height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 15px Segoe UI';
    ctx.fillStyle = '#348983';
    ctx.textAlign = 'center';
    ctx.fillText(obj.name, obj.x + obj.width/2, obj.y + obj.height/2 + 5);
    if (hoveredShape === obj.id) {
      drawIconHitbox(ctx, obj.x + obj.width - 30, obj.y + 10);
      drawEditIcon(ctx, obj.x + obj.width - 30, obj.y + 10);
      drawIconHitbox(ctx, obj.x + obj.width - 52, obj.y + 10);
      drawDeleteIcon(ctx, obj.x + obj.width - 52, obj.y + 10);
      drawResizeHandle(ctx, obj.x, obj.y, obj.width, obj.height);
    }
    ctx.restore();
  }

  // === Relationship types ===
  const relationTypes = {
    association: {arrow: "arrow"},
    aggregation: {arrow: "diamond", fill: "#fff", stroke: "#3347b0"},
    composition: {arrow: "diamond", fill: "#3347b0", stroke: "#3347b0"},
    inheritance: {arrow: "triangle", fill: "#fff", stroke: "#3347b0"},
    dependency:  {arrow: "arrow_open", dashed: true},
    include:     {text: "<<include>>", dashed: true, color: "#2fa84f"},
    extend:      {text: "<<extend>>", dashed: true, color: "#b06a2c"},
    customlabel: { dashed: false, color: '#3347b0', text: '' },
  };

  // === Relationship drawing helpers ===
  function drawArrowHead(ctx, x, y, angle, color, open=false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-16, -7);
    ctx.lineTo(-16, 7);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (!open) ctx.fillStyle = color;
    if (!open) ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawDiamondHead(ctx, x, y, angle, fillColor, strokeColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-22, -8);
    ctx.lineTo(-38, 0);
    ctx.lineTo(-22, 8);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawTriangleHead(ctx, x, y, angle, fillColor, strokeColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-24, -13);
    ctx.lineTo(-24, 13);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawRelationship(ctx, from, to, type) {
    const x1 = from.x + (from.width || 60)/2;
    const y1 = from.y + (from.height || 100)/2;
    const x2 = to.x + (to.width || 60)/2;
    const y2 = to.y + (to.height || 100)/2;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const fromEdgeX = x1 + ((from.width||60)/2) * Math.cos(angle);
    const fromEdgeY = y1 + ((from.height||100)/2) * Math.sin(angle);
    const toEdgeX = x2 - ((to.width||60)/2) * Math.cos(angle);
    const toEdgeY = y2 - ((to.height||100)/2) * Math.sin(angle);

    const settings = relationTypes[type] || {};
    ctx.save();
    if (type === "provided" || type === "required") {
      // Always place both heads at the midpoint, offset by ±5px along the perpendicular
      const midX = (fromEdgeX + toEdgeX) / 2;
      const midY = (fromEdgeY + toEdgeY) / 2;
      // Perpendicular direction (normalized)
      const dx = toEdgeX - fromEdgeX;
      const dy = toEdgeY - fromEdgeY;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      //const perpX = -dy / len;
      //const perpY = dx / len;
      // Socket and lollipop positions
      const socketX = midX - (dx / len) ;
      const socketY = midY - (dy / len) ;
      const lollipopX = midX + (dx / len) ;
      const lollipopY = midY + (dy / len) ;

      // Draw lines from each component to the midpoint
      ctx.beginPath();
      ctx.moveTo(fromEdgeX, fromEdgeY);
      ctx.lineTo(midX, midY);
      ctx.moveTo(toEdgeX, toEdgeY);
      ctx.lineTo(midX, midY);
      ctx.strokeStyle = settings.color || "#b04e2c";
      ctx.lineWidth = settings.width || 2;
      ctx.setLineDash(settings.dashed ? [8, 6] : []);
      ctx.stroke();
      // Draw socket and lollipop at their positions
      // For 'provided', from is provider (socket), to is required (lollipop)
      // For 'required', from is required (lollipop), to is provider (socket)
      if (type === "provided") {
        drawSocketHead(ctx,socketX, socketY, angle, settings.color || "#b04e2c");
        drawLollipopHead(ctx,lollipopX, lollipopY, angle + Math.PI, settings.color || "#b04e2c");
      } else {
        drawLollipopHead(ctx,lollipopX, lollipopY, angle + Math.PI, settings.color || "#b04e2c");
        drawSocketHead(ctx,socketX, socketY, angle, settings.color || "#b04e2c");
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(fromEdgeX, fromEdgeY);
      ctx.lineTo(toEdgeX, toEdgeY);

      if (settings.dashed) ctx.setLineDash([8, 6]);
      else ctx.setLineDash([]);
      ctx.strokeStyle = settings.color || "#3347b0";
      ctx.lineWidth = settings.width || 2;
      ctx.stroke();

      if (type === "association" || type === "activity") {
        drawArrowHead(ctx,toEdgeX, toEdgeY, angle, settings.color || "#3347b0", false);
      } else if (type === "aggregation") {
        drawDiamondHead(ctx,toEdgeX, toEdgeY, angle, "#fff", "#3347b0");
      } else if (type === "composition") {
        drawDiamondHead(ctx,toEdgeX, toEdgeY, angle, "#3347b0", "#3347b0");
      } else if (type === "inheritance") {
        drawTriangleHead(ctx,toEdgeX, toEdgeY, angle, "#fff", "#3347b0");
      } else if (type === "dependency") {
        drawArrowHead(ctx,toEdgeX, toEdgeY, angle, "#3347b0", true);
      } else if (type === "include" || type === "extend") {
        ctx.font = "bold 12px Segoe UI";
        ctx.fillStyle = settings.color || "#3347b0";
        ctx.textAlign = "center";
        const midX = (fromEdgeX + toEdgeX) / 2;
        const midY = (fromEdgeY + toEdgeY) / 2;
        ctx.save();
        ctx.translate(midX, midY);
        ctx.fillText(settings.text, 0, -6);
        ctx.restore();
        drawArrowHead(ctx,toEdgeX, toEdgeY, angle, settings.color || "#3347b0", false);
      }else if (type === "customlabel") {
        ctx.setLineDash([]); // Normal line
        ctx.strokeStyle = settings.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromEdgeX, fromEdgeY);
        ctx.lineTo(toEdgeX, toEdgeY);
        ctx.stroke();
        // Draw arrow head
        drawArrowHead(ctx, toEdgeX, toEdgeY, angle, settings.color || "#3347b0", false);
        ctx.font = 'bold 13px Segoe UI';
        ctx.fillStyle = settings.color;
        ctx.textAlign = 'center';
        const midX = (fromEdgeX + toEdgeX) / 2;
        const midY = (fromEdgeY + toEdgeY) / 2;
        let rel = relationships.find(r => r.fromId === from.id && r.toId === to.id && r.type === 'customlabel');
        if (rel && rel.text) {
          ctx.fillText(rel.text, midX, midY - 6);
        }
        ctx.restore();
        return;
      }
    }
    ctx.restore();
  }

  function drawLollipopHead(ctx, x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-1, 0);
    ctx.stroke();
    ctx.restore();
  }
  function drawSocketHead(ctx,x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.arc(0, 0, 14, Math.PI * 0.5 , Math.PI * 1.5 );
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-1, 0);
    ctx.stroke();
    ctx.restore();
  }

  // === Relationship creation logic ===
  function findElementAt(x, y) {
    // Check from topmost to bottom
    for (let i = classes.length - 1; i >= 0; i--) {
      const obj = classes[i];
      if (
          x >= obj.x && x <= obj.x + (obj.width || 60) &&
          y >= obj.y && y <= obj.y + (obj.height || 100)
      ) {
        return obj;
      }
    }
    return null;
  }

  // Helper: check if point is near a line segment
  function isPointNearLine(px, py, x1, y1, x2, y2, tolerance = 7) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx;
    const dy = py - yy;
    return (dx * dx + dy * dy) <= tolerance * tolerance;
  }

  function handleCanvasClick(e) {
    if (!canEdit) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Check for icon clicks for all elements
    for (let i = classes.length - 1; i >= 0; i--) {
      const obj = classes[i];
      const { nameX, nameY, nameWidth, align } = getNameAndIconPosition(ctx, obj);
      const iconBaseX = align === 'center' ? nameX + nameWidth / 2 : nameX + nameWidth;
      const editIcon = { x: iconBaseX + 8, y: nameY - 12, w: 24, h: 24 };
      const deleteIcon = { x: iconBaseX + 32, y: nameY - 12, w: 24, h: 24 };

      if (mx >= editIcon.x && mx <= editIcon.x + editIcon.w && my >= editIcon.y && my <= editIcon.y + editIcon.h) {
        showModal('Edit Name', obj.name, val => {
          if (val) {
            if (!isValidElementName(val)) {
              alert('Class name must not be empty, only numbers, or contain spaces.');
              return;
            }
            setClasses(prev => prev.map(c => c.id === obj.id ? { ...c, name: val } : c));
            sendUmlAction({
              type: 'update',
              elementType: 'class',
              payload: { ...obj, name: val },
              projectId,
            });
          }
        });
        return;
      }
      if (mx >= deleteIcon.x && mx <= deleteIcon.x + deleteIcon.w && my >= deleteIcon.y && my <= deleteIcon.y + deleteIcon.h) {
        setClasses(prev => prev.filter(c => c.id !== obj.id));
        setRelationships(prev => prev.filter(r => r.fromId !== obj.id && r.toId !== obj.id));
        sendUmlAction({
          type: 'delete',
          elementType: 'class',
          payload: obj,
          projectId,
        });
        return;
      }
    }

    if (relationMode) {
      // First, check if user clicked near a relationship to delete
      for (let i = relationships.length - 1; i >= 0; i--) {
        const rel = relationships[i];
        const from = classes.find(c => c.id === rel.fromId);
        const to = classes.find(c => c.id === rel.toId);
        if (!from || !to) continue;
        const x1 = from.x + (from.width || 60)/2;
        const y1 = from.y + (from.height || 100)/2;
        const x2 = to.x + (to.width || 60)/2;
        const y2 = to.y + (to.height || 100)/2;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const fromEdgeX = x1 + ((from.width||60)/2) * Math.cos(angle);
        const fromEdgeY = y1 + ((from.height||100)/2) * Math.sin(angle);
        const toEdgeX = x2 - ((to.width||60)/2) * Math.cos(angle);
        const toEdgeY = y2 - ((to.height||100)/2) * Math.sin(angle);
        if (isPointNearLine(mx, my, fromEdgeX, fromEdgeY, toEdgeX, toEdgeY)) {
          setRelationships(prev => prev.filter((_, idx) => idx !== i));
          sendUmlAction({
            type: 'delete',
            elementType: 'relationship',
            payload: rel,
            projectId,
          });
          return;
        }
      }
      // Otherwise, proceed with relationship creation
      const obj = findElementAt(mx, my);
      if (!obj) return;
      if (!pendingRelation.fromId) {
        setPendingRelation({ ...pendingRelation, fromId: obj.id });
      } else {
        // Allow recursive (self) relationships for customlabel
        const isSelfRelation = pendingRelation.fromId === obj.id;
        const isCustomLabel = pendingRelation.type === 'customlabel';
        if (!relationships.some(r => r.fromId === pendingRelation.fromId && r.toId === obj.id && r.type === pendingRelation.type)) {
          if (isCustomLabel) {
            showModal('Relationship Label', '', label => {
              if (!label) return setPendingRelation({ fromId: null, type: pendingRelation.type });
              const newRelationship = { fromId: pendingRelation.fromId, toId: obj.id, type: pendingRelation.type, text: label };
              setRelationships(prev => [...prev, newRelationship]);
              sendUmlAction({
                type: 'add',
                elementType: 'relationship',
                payload: newRelationship,
                projectId,
              });
              setPendingRelation({ fromId: null, type: pendingRelation.type });
            });
            return;
          } else if (!isSelfRelation) {
            // Only prevent self-relationship for non-customlabel types
            const newRelationship = { 
              id: generateRelationshipId(), // Add ID
              fromId: pendingRelation.fromId, 
              toId: obj.id, 
              type: pendingRelation.type 
            };
            setRelationships(prev => [...prev, newRelationship]);
            sendUmlAction({
              type: 'add',
              elementType: 'relationship',
              payload: newRelationship,
              projectId,
            });
          }
        }
        setPendingRelation({ fromId: null, type: pendingRelation.type });
      }
      return;
    }
    // Attribute/method/class editing for classes
    for (let i = classes.length - 1; i >= 0; i--) {
      const obj = classes[i];
      if (isPointInName(obj, mx, my, ctx)) {
        showModal('Edit Name', obj.name, val => {
          if (val) {
            
            setClasses(prev => prev.map(c => c.id === obj.id ? { ...c, name: val } : c));
            sendUmlAction({
              type: 'update',
              elementType: 'class',
              payload: { ...obj, name: val },
              projectId,
            });
          }
        });
        return;
      }
      if (obj.type === 'class') {
        // Class name edit/delete icons
        if (mx >= obj.x + obj.width - 30 && mx <= obj.x + obj.width - 6 && my >= obj.y + 10 && my <= obj.y + 34) {
          showModal('Edit Class Name', obj.name, val => {
            if (val) {
              setClasses(prev => prev.map(c => c.id === obj.id ? { ...c, name: val } : c));
              sendUmlAction({
                type: 'update',
                elementType: 'class',
                payload: { ...obj, name: val },
                projectId,
              });
            }
          });
          return;
        }
        if (mx >= obj.x + obj.width - 52 && mx <= obj.x + obj.width - 28 && my >= obj.y + 10 && my <= obj.y + 34) {
          setClasses(prev => prev.filter(c => c.id !== obj.id));
          setRelationships(prev => prev.filter(r => r.fromId !== obj.id && r.toId !== obj.id));
          sendUmlAction({
            type: 'delete',
            elementType: 'class',
            payload: obj,
            projectId,
          });
          return;
        }
        // Attributes
        let attrY = obj.y + 44;
        for (let j = 0; j < obj.attributes.length; j++) {
          // Edit icon
          if (mx >= obj.x + obj.width - 52 && mx <= obj.x + obj.width - 28 && my >= attrY + 2 && my <= attrY + 26) {
            showModal('Edit Attribute', obj.attributes[j].name, ({ name, visibility }) => {
              if (name) {
                setClasses(prev => prev.map(c =>
                    c.id === obj.id ? { ...c, attributes: c.attributes.map((a, k) =>
                          k === j ? { ...a, name, visibility } : a
                      ) } : c
                ));
                sendUmlAction({
                  type: 'update',
                  elementType: 'class',
                  payload: { ...obj, attributes: obj.attributes.map((a, k) =>
                      k === j ? { ...a, name, visibility } : a
                  ) },
                  projectId,
                });
              }
            }, true, obj.attributes[j].visibility || 'public');
            return;
          }
          // Delete icon
          if (mx >= obj.x + obj.width - 30 && mx <= obj.x + obj.width - 6 && my >= attrY + 2 && my <= attrY + 26) {
            setClasses(prev => prev.map(c => c.id === obj.id ? { ...c, attributes: c.attributes.filter((_, k) => k !== j) } : c));
            sendUmlAction({
              type: 'update',
              elementType: 'class',
              payload: { ...obj, attributes: obj.attributes.filter((_, k) => k !== j) },
              projectId,
            });
            return;
          }
          attrY += 24;
        }
        // Add attribute
        if (mx >= obj.x + 18 && mx <= obj.x + obj.width - 18 && my >= attrY - 12 && my <= attrY + 8) {
          showModal('Add Attribute', '', ({ name, visibility }) => {
            setClasses(prev => prev.map(c =>
              c.id === obj.id ? { ...c, attributes: [...c.attributes, { name, visibility }] } : c
            ));
            sendUmlAction({
              type: 'update',
              elementType: 'class',
              payload: { ...obj, attributes: [...obj.attributes, { name, visibility }] },
              projectId,
            });
          }, true);
          return;
        }
        // Methods
        let methodSectionY = attrY + 20;
        let methodY = methodSectionY;
        for (let j = 0; j < obj.methods.length; j++) {
          // Edit icon
          if (mx >= obj.x + obj.width - 52 && mx <= obj.x + obj.width - 28 && my >= methodY + 2 && my <= methodY + 26) {
            showModal('Edit Method', obj.methods[j].name, ({ name, visibility }) => {
              if (name) {
                
                setClasses(prev => prev.map(c =>
                    c.id === obj.id ? { ...c, methods: c.methods.map((m, k) =>
                          k === j ? { ...m, name, visibility } : m
                      ) } : c
                ));
                sendUmlAction({
                  type: 'update',
                  elementType: 'class',
                  payload: { ...obj, methods: obj.methods.map((m, k) =>
                      k === j ? { ...m, name, visibility } : m
                  ) },
                  projectId,
                });
              }
            }, true, obj.methods[j].visibility || 'public');

            return;
          }
          // Delete icon
          if (mx >= obj.x + obj.width - 30 && mx <= obj.x + obj.width - 6 && my >= methodY + 2 && my <= methodY + 26) {
            setClasses(prev => prev.map(c => c.id === obj.id ? { ...c, methods: c.methods.filter((_, k) => k !== j) } : c));
            sendUmlAction({
              type: 'update',
              elementType: 'class',
              payload: { ...obj, methods: obj.methods.filter((_, k) => k !== j) },
              projectId,
            });
            return;
          }
          methodY += 24;
        }
        // Add method
        if (mx >= obj.x + 18 && mx <= obj.x + obj.width - 18 && my >= methodY - 12 && my <= methodY + 8) {
          showModal('Add Method', '', ({ name, visibility }) => {
            
            setClasses(prev => prev.map(c =>
              c.id === obj.id ? { ...c, methods: [...c.methods, { name, visibility }] } : c
            ));
            sendUmlAction({
              type: 'update',
              elementType: 'class',
              payload: { ...obj, methods: [...obj.methods, { name, visibility }] },
              projectId,
            });
          }, true);

          return;
        }
      }
    }
  }

  function isPointInName(obj, mx, my, ctx) {
    ctx.save();
    let x, y, w, h;
    if (obj.type === 'class') {
      ctx.font = "bold 18px Segoe UI, Arial";
      w = ctx.measureText(obj.name).width;
      x = obj.x + 16;
      y = obj.y + 10;
      h = 24;
    } else if (obj.type === 'actor') {
      ctx.font = '15px Segoe UI';
      w = ctx.measureText(obj.name).width;
      x = obj.x + obj.width / 2 - w / 2;
      y = obj.y + obj.height + 18 - 16;
      h = 22;
    } else if (obj.type === 'usecase') {
      ctx.font = '15px Segoe UI';
      w = ctx.measureText(obj.name).width;
      x = obj.x + obj.width / 2 - w / 2;
      y = obj.y + obj.height / 2 + 5 - 16;
      h = 22;
    } else if (obj.type === 'system') {
      ctx.font = 'bold 16px Segoe UI';
      w = ctx.measureText(obj.name).width;
      x = obj.x + 10;
      y = obj.y + 10 - 8;
      h = 22;
    }else if (obj.type === 'action') {
      ctx.font = '16px Segoe UI';
      w = ctx.measureText(obj.name).width;
      x = obj.x + obj.width / 2 - w / 2;
      y = obj.y + obj.height / 2 - 10;
      h = 22;
    } else if ([
      'node', 'artifact', 'device', 'component', 'interface', 'port','flow_startend', 'flow_process', 'flow_decision', 'flow_io'
    ].includes(obj.type)) {
      ctx.font = 'bold 15px Segoe UI';
      w = ctx.measureText(obj.name).width;
      x = obj.x + (obj.width / 2) - w / 2;
      y = obj.y + (obj.height / 2) + 4 - 12;
      h = 22;
    }
    ctx.restore();
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
  }

  // === Main draw function ===
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoom, zoom);
    drawGrid(ctx, canvas.width / zoom, canvas.height / zoom, 25);
    // Draw relationships below nodes
    relationships.forEach(rel => {
      const from = classes.find(c => c.id === rel.fromId);
      const to = classes.find(c => c.id === rel.toId);
      if (from && to) drawRelationship(ctx, from, to, rel.type);
    });
    classes.filter(obj => obj.type === "class").forEach(obj => drawClass(ctx, obj));
    classes.filter(obj => obj.type === 'actor').forEach(obj => drawActor(ctx, obj));
    classes.filter(obj => obj.type === 'usecase').forEach(obj => drawUseCase(ctx, obj));
    classes.filter(obj => obj.type === 'system').forEach(obj => drawSystemBoundary(ctx, obj));
    classes.filter(obj => obj.type === 'action').forEach(obj => drawActionNode(ctx, obj));
    classes.filter(obj => obj.type === 'initial').forEach(obj => drawInitialNode(ctx, obj));
    classes.filter(obj => obj.type === 'final').forEach(obj => drawFinalNode(ctx, obj));
    classes.filter(obj => obj.type === 'fork').forEach(obj => drawForkNode(ctx, obj));
    classes.filter(obj => obj.type === 'decision').forEach(obj => drawDecisionNode(ctx, obj));
    classes.filter(obj => obj.type === 'node').forEach(obj => drawNodeElement(ctx, obj));
    classes.filter(obj => obj.type === 'artifact').forEach(obj => drawArtifactElement(ctx, obj));
    classes.filter(obj => obj.type === 'device').forEach(obj => drawDeviceElement(ctx, obj));
    classes.filter(obj => obj.type === 'component').forEach(obj => drawComponentElement(ctx, obj));
    classes.filter(obj => obj.type === 'interface').forEach(obj => drawInterfaceElement(ctx, obj));
    classes.filter(obj => obj.type === 'port').forEach(obj => drawPortElement(ctx, obj));
    classes.filter(obj => obj.type === 'flow_startend').forEach(obj => drawFlowStartEnd(ctx, obj));
    classes.filter(obj => obj.type === 'flow_process').forEach(obj => drawFlowProcess(ctx, obj));
    classes.filter(obj => obj.type === 'flow_decision').forEach(obj => drawFlowDecision(ctx, obj));
    classes.filter(obj => obj.type === 'flow_io').forEach(obj => drawFlowInputOutput(ctx, obj));
    ctx.restore();
  }, [classes, relationships, hoveredShape, zoom]);

  // === Toolbar actions ===
  const forbiddenStartChars = ['*', '=', '/', '\\', '.', ',', '!', '@', '$', '%', '^', '&', '[', ']', '{', '}', ';', '?', '<', '>', '|', '`', '"', "'"];
  const isValidElementName = name => {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (/\d/.test(trimmed[0])) return false; // starts with a number
    if (forbiddenStartChars.includes(trimmed[0])) return false;
    if (/\s/.test(trimmed)) return false; // no spaces allowed
    return true;
  };

  // Only allow editing if permission is OWNER or EDIT
  const canEdit = permission === 'OWNER' || permission === 'EDIT';

  const handleAddClass = () => {
    if (!canEdit) return;
    showModal('Class Name', '', name => {
      if (!isValidElementName(name)) {
        alert('Class name must not be empty, only numbers, or contain spaces.');
        return;
      }
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newClass = UmlClass(x, y, name.trim());
      setClasses(prev => [...prev, newClass]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newClass,
        projectId,
      });
    });
  };

  const handleAddActor = () => {
    if (!canEdit) return;
    showModal('Actor Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newActor = Actor(x, y, name.trim());
      setClasses(prev => [...prev, newActor]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newActor,
        projectId,
      });
    });
  };
  const handleAddUseCase = () => {
    if (!canEdit) return;
    showModal('Use Case Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newUseCase = UseCase(x, y, name.trim());
      setClasses(prev => [...prev, newUseCase]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newUseCase,
        projectId,
      });
    });
  };
  const handleAddSystem = () => {
    if (!canEdit) return;
    showModal('System Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 400;
      const y = 100 + Math.random() * 200;
      const newSystem = SystemBoundary(x, y, name.trim());
      setClasses(prev => [...prev, newSystem]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newSystem,
        projectId,
      });
    });
  };

  const handleAddAction = () => {
    if (!canEdit) return;
    showModal('Action Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newAction = ActionNode(x, y, name.trim());
      setClasses(prev => [...prev, newAction]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newAction,
        projectId,
      });
    });
  };
  const handleAddInitial = () => {
    if (!canEdit) return;
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    const newInitialNode = InitialNode(x,y);
    setClasses(prev => [...prev, newInitialNode]);
    sendUmlAction({
      type: 'add',
      elementType: 'class',
      payload: newInitialNode,
      projectId,
    });
  };
  const handleAddFinal = () => {
    if (!canEdit) return;
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    const newFinalNode = FinalNode(x,y);
    setClasses(prev => [...prev, newFinalNode]);
    sendUmlAction({
      type: 'add',
      elementType: 'class',
      payload: newFinalNode,
      projectId,
    });
  };
  const handleAddFork = () => {
    if (!canEdit) return;
    showModal('Fork/Join Orientation (h/v)', 'h', dir => {
      const orientation = (dir && dir.toLowerCase().startsWith('v')) ? 'vertical' : 'horizontal';
      const w = orientation === 'horizontal' ? 80 : 12;
      const h = orientation === 'vertical' ? 80 : 12;
      const x = 100 + Math.random() * (600 - w);
      const y = 100 + Math.random() * (400 - h);
      const newForkNode = ForkNode(x,y,orientation);
      setClasses(prev => [...prev, newForkNode]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newForkNode,
        projectId,
      });
    });
  };
  const handleAddDecision = () => {
    if (!canEdit) return;
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    const newDecisionNode = DecisionNode(x,y);
    setClasses(prev => [...prev, newDecisionNode]);
    sendUmlAction({
      type: 'add',
      elementType: 'class',
      payload: newDecisionNode,
      projectId,
    });
  };
  const handleAddNode = () => {
    if (!canEdit) return;
    showModal('Node Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newNodeElement = NodeElement(x,y,name.trim());
      setClasses(prev => [...prev, newNodeElement]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newNodeElement,
        projectId,
      });
    });
  };
  const handleAddArtifact = () => {
    if (!canEdit) return;
    showModal('Artifact Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newArtifactElement = ArtifactElement(x,y,name.trim());
      setClasses(prev => [...prev, newArtifactElement]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newArtifactElement,
        projectId,
      });
    });
  };
  const handleAddDevice = () => {
    if (!canEdit) return;
    showModal('Device Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newDeviceElement = DeviceElement(x,y,name.trim());
      setClasses(prev => [...prev, newDeviceElement]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newDeviceElement,
        projectId,
      });
    });
  };
  const handleAddComponent = () => {
    if (!canEdit) return;
    showModal('Component Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newComponentElement = ComponentElement(x, y, name.trim());
      setClasses(prev => [...prev, newComponentElement]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newComponentElement,
        projectId,
      });
    });
  };
  const handleAddInterface = () => {
    if (!canEdit) return;
    showModal('Interface Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newInterface = InterfaceElement(x, y, name.trim());
      setClasses(prev => [...prev, newInterface]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newInterface,
        projectId,
      });
    });
  };
  const handleAddPort = () => {
    if (!canEdit) return;
    showModal('Port Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const newPortElement = PortElement(x, y, name.trim());
      setClasses(prev => [...prev, newPortElement]);
      sendUmlAction({
        type: 'add',
        elementType: 'class',
        payload: newPortElement,
        projectId,
      });
    });
  };

  const handleAddFlowStartEnd = () => {
    if (!canEdit) return;
    showModal('Start/End Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const obj = FlowStartEnd(x, y, name);
      setClasses(prev => [...prev, obj]);
      sendUmlAction({ type: 'add', elementType: 'class', payload: obj, projectId });
    });
  };
  const handleAddFlowProcess = () => {
    if (!canEdit) return;
    showModal('Process Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const obj = FlowProcess(x, y, name);
      setClasses(prev => [...prev, obj]);
      sendUmlAction({ type: 'add', elementType: 'class', payload: obj, projectId });
    });
  };
  const handleAddFlowDecision = () => {
    if (!canEdit) return;
    showModal('Decision Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const obj = FlowDecision(x, y, name);
      setClasses(prev => [...prev, obj]);
      sendUmlAction({ type: 'add', elementType: 'class', payload: obj, projectId });
    });
  };
  const handleAddFlowInputOutput = () => {
    if (!canEdit) return;
    showModal('Input/Output Name', '', name => {
      if (!name) return;
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      const obj = FlowInputOutput(x, y, name);
      setClasses(prev => [...prev, obj]);
      sendUmlAction({ type: 'add', elementType: 'class', payload: obj, projectId });
    });
  };

  // === Component Relationship Modal ===
  const [compRelModal, setCompRelModal] = useState(false);
  const [compRelState, setCompRelState] = useState({ name1: '', name2: '', relType: 'provided' });

  function openCompRelModal() {
    setCompRelState({ name1: '', name2: '', relType: 'provided' });
    setCompRelModal(true);
  }
  function closeCompRelModal() {
    setCompRelModal(false);
  }
  function handleCompRelOk() {
    const { name1, name2, relType } = compRelState;
    if (!name1.trim() || !name2.trim()) {
      alert('Please enter both component names.');
      return;
    }
    const comp1 = classes.find(c => c.type === 'component' && c.name === name1.trim());
    const comp2 = classes.find(c => c.type === 'component' && c.name === name2.trim());
    if (!comp1 || !comp2) {
      alert('Component(s) not found by name.');
      return;
    }
    if (comp1.id === comp2.id) {
      alert('Cannot relate a component to itself.');
      return;
    }
    const newRelationship = { 
      id: Math.random().toString(36).slice(2), // Generate a unique id if not already handled elsewhere
      fromId: comp1.id, 
      toId: comp2.id, 
      type: relType 
    };
  
    // 1. Update local state
    setRelationships(prev => [...prev, newRelationship]);
  
    // 2. Broadcast to all users
    sendUmlAction({
      type: 'add',
      elementType: 'relationship',
      payload: newRelationship,
      projectId
    });
    setRelationships(prev => [...prev, { fromId: comp1.id, toId: comp2.id, type: relType }]);
    setCompRelModal(false);
  }

  // === Utility and element constructors ===
  let classIdCounter = 1;
  function generateClassId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "cls" + (classIdCounter++);
  }
  let relationshipIdCounter = 1;
function generateRelationshipId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "rel" + (relationshipIdCounter++);
}

  function UmlClass(x, y, name = "ClassName") {
    return {
      id: generateClassId(),
      type: "class",
      x,
      y,
      width: 160,
      height: 120,
      name,
      attributes: [],
      methods: []
    };
  }
  function Actor(x, y, name = "Actor") {
    return {
      id: generateClassId(),
      type: "actor",
      x,
      y,
      width: 48,
      height: 80,
      name
    };
  }
  function UseCase(x, y, name = "Use Case") {
    return {
      id: generateClassId(),
      type: "usecase",
      x,
      y,
      name,
      width: 120,
      height: 50
    };
  }
  function SystemBoundary(x, y, name = "System") {
    return {
      id: generateClassId(),
      type: "system",
      x,
      y,
      name,
      width: 400,
      height: 300
    };
  }

  function ActionNode(x, y, name = "Action") {
    return {
      id: generateClassId(),
      type: "action",
      x,
      y,
      width: 120,
      height: 48,
      name
    };
  }
  function InitialNode(x, y) {
    return {
      id: generateClassId(),
      type: "initial",
      x,
      y,
      width: 34,
      height: 34
    };
  }
  function FinalNode(x, y) {
    return {
      id: generateClassId(),
      type: "final",
      x,
      y,
      width: 38,
      height: 38
    };
  }
  function ForkNode(x, y, orientation = "horizontal") {
    return {
      id: generateClassId(),
      type: "fork",
      x,
      y,
      orientation,
      width: orientation === "horizontal" ? 80 : 12,
      height: orientation === "vertical" ? 80 : 12
    };
  }
  function DecisionNode(x, y) {
    return {
      id: generateClassId(),
      type: "decision",
      x,
      y,
      width: 48,
      height: 48,
      name: ""
    };
  }
  function NodeElement(x, y, name = "Node") {
    return {
      id: generateClassId(),
      type: "node",
      x,
      y,
      width: 120,
      height: 70,
      name
    };
  }
  function ArtifactElement(x, y, name = "Artifact") {
    return {
      id: generateClassId(),
      type: "artifact",
      x,
      y,
      width: 90,
      height: 50,
      name
    };
  }
  function DeviceElement(x, y, name = "Device") {
    return {
      id: generateClassId(),
      type: "device",
      x,
      y,
      width: 130,
      height: 70,
      name
    };
  }
  function ComponentElement(x, y, name = "Component") {
    return {
      id: generateClassId(),
      type: "component",
      x,
      y,
      width: 130,
      height: 70,
      name
    };
  }
  function InterfaceElement(x, y, name = "Interface") {
    return {
      id: generateClassId(),
      type: "interface",
      x,
      y,
      width: 100,
      height: 50,
      name
    };
  }
  function PortElement(x, y, name = "Port") {
    return {
      id: generateClassId(),
      type: "port",
      x,
      y,
      width: 40,
      height: 40,
      name
    };
  }

  function FlowStartEnd(x, y, name = "Start/End") {
    return {
      id: generateClassId(),
      type: "flow_startend",
      x,
      y,
      width: 100,
      height: 48,
      name
    };
  }
  function FlowProcess(x, y, name = "Process") {
    return {
      id: generateClassId(),
      type: "flow_process",
      x,
      y,
      width: 120,
      height: 56,
      name
    };
  }
  function FlowDecision(x, y, name = "Decision") {
    return {
      id: generateClassId(),
      type: "flow_decision",
      x,
      y,
      width: 90,
      height: 90,
      name
    };
  }
  function FlowInputOutput(x, y, name = "Input/Output") {
    return {
      id: generateClassId(),
      type: "flow_io",
      x,
      y,
      width: 110,
      height: 48,
      name
    };
  }

  function handleSavePng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'uml-diagram.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // Relationship mode toggle handler
  function handleRelationModeToggle(e) {
    setRelationMode(e.target.checked);
    setPendingRelation({ fromId: null, type: pendingRelation.type });
  }

  // Relationship type change handler
  function handleRelationTypeChange(e) {
    setPendingRelation(prev => ({ ...prev, type: e.target.value }));
  }

  const [, setGeneratedCode] = useState('');

  const [showJavaImport, setShowJavaImport] = useState(false);
  const [javaCodeInput, setJavaCodeInput] = useState('');

  function parseJavaCode(code) {
  const classes = [];
  const relationships = [];
  
  // Split code into individual class declarations
  const classBlocks = code.split(/(?=public\s+class|private\s+class|protected\s+class|class)/g);
  
  classBlocks.forEach(block => {
    // Extract class declaration
    const classMatch = block.match(/class\s+(\w+)(?:\s+extends\s+(\w+))?/);
    if (!classMatch) return;
    
    const className = classMatch[1].trim();
    const parentClass = classMatch[2] && classMatch[2].trim();
    const classBody = block.slice(classMatch.index + classMatch[0].length);
    
    // Create new class
    const newClass = {
      id: `cls_${className}`,
      type: 'class',
      name: className,
      x: 100 + classes.length * 300,
      y: 100,
      width: 200,
      height: 150,
      attributes: [],
      methods: []
    };
    
    // Add inheritance relationship
    if (parentClass) {
      relationships.push({
        fromId: newClass.id,
        toId: `cls_${parentClass}`,
        type: 'inheritance'
      });
    }
    
    // Parse fields scoped to this class
    const fieldRegex = /(public|private|protected)\s+([\w<>]+)\s+(\w+)\s*;/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(classBody)) !== null) {
      newClass.attributes.push({
        name: `${fieldMatch[3].trim()}: ${fieldMatch[2].trim()}`,
        visibility: fieldMatch[1].toLowerCase()
      });
    }
    
    // Parse methods scoped to this class
    // In the method parsing section:
const methodRegex = /(public|private|protected)\s+([\w<>]+)\s+(\w+)\s*\(([^)]*)\)/g;
let methodMatch;
while ((methodMatch = methodRegex.exec(classBody)) !== null) {
  const params = methodMatch[4]
    .split(',')
    .map(p => p.trim())
    .filter(p => p)
    .map(p => {
      const parts = p.split(/\s+/).filter(Boolean);
      return {
        name: (parts[1] || 'param').trim(),
        type: (parts[0] || 'Object').trim()
      };
    });

  const paramString = params.map(p => `${p.name}: ${p.type}`).join(', ');
  
  newClass.methods.push({
    name: `${methodMatch[3].trim()}${params.length ? `(${paramString})` : '()'}: ${methodMatch[2].trim()}`,
    visibility: methodMatch[1].toLowerCase()
  });
}
    
    classes.push(newClass);
  });
  
  return { classes, relationships };
}

  function generateJavaCode(classes, relationships) {
  
    const visibilityMap = {
      'public': 'public',
      'private': 'private',
      'protected': 'protected',
      'package': '/* package */'
    };
    const parseAttribute = (attrName) => {
      const [name, type] = attrName.split(':').map(s => s.trim());
      return {
        name: name || 'unknown',
        type: type || 'String'
      };
    };
  
    const parseMethod = (methodName) => {
      const parts = methodName.split(':').map(s => s.trim());
      let returnType = 'void';
      let signature = methodName;
  
      if (parts.length > 1) {
        returnType = parts.pop();
        signature = parts.join(':').trim();
      }
  
      if (!signature.includes('(') || !signature.endsWith(')')) {
        signature = `${signature.replace(/\)?$/, '')}()`;
      }
  
      const [namePart, paramsPart] = signature.split(/\((.*)\)/s);
      const params = paramsPart 
        ? paramsPart.split(',')
            .map(param => {
              const [pName, pType] = param.split(':').map(s => s.trim());
              return {
                name: pName || 'param',
                type: pType || 'Object'
              };
            })
            .filter(p => p.name)
        : [];
      return {
        name: namePart.trim(),
        params,
        returnType: returnType || 'void'
      };
    };
  
    let code = '';
    const processedClasses = new Set();
  
    classes.forEach(cls => {
      if (processedClasses.has(cls.id)) return;
      processedClasses.add(cls.id);
  
      // Class declaration
      code += `public class ${cls.name} `;
      
      // Handle inheritance
      const inheritance = relationships.find(r => 
        r.type === 'inheritance' && r.fromId === cls.id
      );
      if (inheritance) {
        const parent = classes.find(c => c.id === inheritance.toId);
        code += `extends ${parent?.name} `;
      }
      
      code += '{\n';
  
      // Fields
      cls.attributes.forEach(attr => {
        const parsed = parseAttribute(attr.name);
        code += `    ${visibilityMap[attr.visibility]} ${parsed.type} ${parsed.name};\n`;
      });
  
      // Methods
      cls.methods.forEach(method => {
        const parsed = parseMethod(method.name);
        code += `    ${visibilityMap[method.visibility]} ${parsed.returnType} ${parsed.name}(`;
        code += parsed.params.map(p => `${p.type} ${p.name}`).join(', ');
        code += `) {\n`;
        code += `        // TODO: Implement method\n`;
        code += `    }\n\n`;
      });
  
      code += '}\n\n';
    });
  
    return code;
  }
  
  // Update the handleGenerateCode function
  function handleGenerateCode() {
    const hasNonClass = classes.some(c => c.type !== 'class');
    if (hasNonClass) {
      alert('Java code generation only supports class diagram elements!');
      return;
    }
  
    const code = generateJavaCode(classes, relationships);
    setGeneratedCode(code);
    setModal({ 
      open: true, 
      title: 'Generated Java Code', 
      value: code,
    });
  }

  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(modal.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy code. Please copy manually.');
    }
  };
  

  // === Render ===
  return (
      <>
        <style>{styless}</style>
        <div id="canvas-container">
          <canvas
              id="uml-canvas"
              ref={canvasRef}
              width={1600}
              height={800}
              style={styles.canvas}
              onClick={canEdit ? handleCanvasClick : undefined}
          />
          <div id="toolbar">
            <div className="toolbar-group">
              <span className="toolbar-label">Class</span>
              <button className="toolbar-btn" onClick={handleAddClass} disabled={!canEdit}>Add Class</button>
            </div>
            <div className="toolbar-group">
              <span  className="toolbar-label">Use Case</span>
              <button className="toolbar-btn" onClick={handleAddActor} disabled={!canEdit}>Add Actor</button>
              <button className="toolbar-btn" onClick={handleAddUseCase} disabled={!canEdit}>Add Use Case</button>
              <button className="toolbar-btn" onClick={handleAddSystem} disabled={!canEdit}>Add System</button>
            </div>
            <div className="toolbar-group">
            <span className="toolbar-label">Activity</span>
            <button className="toolbar-btn" onClick={handleAddAction} disabled={!canEdit}>Add Action</button>
            <button className="toolbar-btn" onClick={handleAddInitial} disabled={!canEdit}>Add Initial Node</button>
            <button className="toolbar-btn" onClick={handleAddFinal} disabled={!canEdit}>Add Final Node</button>
            <button className="toolbar-btn" onClick={handleAddFork} disabled={!canEdit}>Add Fork/Join</button>
            <button className="toolbar-btn" onClick={handleAddDecision} disabled={!canEdit}>Add Decision</button>
          </div>
          <div className="toolbar-group">
            <span className="toolbar-label">Deployment</span>
            <button className="toolbar-btn" onClick={handleAddNode} disabled={!canEdit}>Add Node</button>
            <button className="toolbar-btn" onClick={handleAddArtifact} disabled={!canEdit}>Add Artifact</button>
            <button className="toolbar-btn" onClick={handleAddDevice} disabled={!canEdit}>Add Device</button>
          </div>
          <div className="toolbar-group">
            <span className="toolbar-label">Component</span>
            <button className="toolbar-btn" onClick={handleAddComponent} disabled={!canEdit}>Add Component</button>
            <button className="toolbar-btn" onClick={handleAddInterface} disabled={!canEdit}>Add Interface</button>
            <button className="toolbar-btn" onClick={handleAddPort} disabled={!canEdit}>Add Port</button>
            <button className="toolbar-btn" onClick={openCompRelModal} disabled={!canEdit}>Add Component Relationship</button>
          </div>
            <div className="toolbar-group">
              <span className="toolbar-label">Flowchart</span>
              <button className="toolbar-btn" onClick={handleAddFlowStartEnd} disabled={!canEdit}>Start/End</button>
              <button className="toolbar-btn" onClick={handleAddFlowProcess} disabled={!canEdit}>Process</button>
              <button className="toolbar-btn" onClick={handleAddFlowDecision} disabled={!canEdit}>Decision</button>
              <button className="toolbar-btn" onClick={handleAddFlowInputOutput} disabled={!canEdit}>Input/Output</button>
            </div>
            <div className="toolbar-group">
              <label id="relation-mode-label">
                <input type="checkbox" checked={relationMode} onChange={handleRelationModeToggle} disabled={!canEdit} />
                <span style={{marginLeft:5}}>Relationship</span>
              </label>
              <select id="relation-type" value={pendingRelation.type} onChange={handleRelationTypeChange} disabled={!canEdit}>
                <option value="association">Association</option>
                <option value="aggregation">Aggregation</option>
                <option value="composition">Composition</option>
                <option value="inheritance">Inheritance</option>
                <option value="dependency">Dependency</option>
                <option value="include">Include</option>
                <option value="extend">Extend</option>
                <option value="activity">Activity Flow</option>
                <option value="customlabel">Communication Message </option>
              </select>
            </div>
          </div>

          {/* Java Code Generation Modal */}
{modal.open && (
  <div style={styles.modalOverlay} onClick={closeModal}>
    <div style={styles.modal} onClick={e => e.stopPropagation()}>
      {/* Copy Button Header */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <span style={{ fontWeight: 'bold', fontSize: 18 }}>{modal.title}</span>
        {modal.title === 'Generated Java Code' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {copied && <span style={{ color: '#2fa84f', fontSize: 14 }}>Copied!</span>}
            <button 
              style={{ 
                ...styles.button, 
                padding: '6px 14px',
                fontSize: 14,
                background: '#2fa84f'
              }}
              onClick={handleCopyCode}
            >
              Copy
            </button>
          </div>
        )}
      </div>

      {modal.title === 'Generated Java Code' ? (
        <pre style={{
          background: '#f5f5f5',
          padding: 16,
          borderRadius: 6,
          maxHeight: '60vh',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          width:'500px',
          margin: 0,
          fontFamily: 'monospace',
          fontSize: 14
        }}>
          {modal.value}
        </pre>
      ) : (
        <>
          <input
            style={styles.input}
            value={modal.value}
            onChange={e => setModal(m => ({ ...m, value: e.target.value }))}
            autoFocus
          />
          {modal.withVisibility && (
            <select
              style={{ ...styles.input, marginBottom: 12 }}
              value={modal.currentVisibility}
              onChange={e => setModal(m => ({ ...m, currentVisibility: e.target.value }))}
            >
              <option value="public">public (+)</option>
              <option value="private">private (-)</option>
              <option value="protected">protected (#)</option>
              <option value="package">package (~)</option>
            </select>
          )}
        </>
      )}

      <div style={{ 
        display: 'flex',
        gap: 10,
        marginTop: modal.title === 'Generated Java Code' ? 16 : 0 
      }}>
        {modal.title === 'Generated Java Code' ? (
          <button style={styles.button} onClick={closeModal}>
            Close
          </button>
        ) : (
          <>
            <button 
              style={styles.button} 
              onClick={() => {
                if (modal.withVisibility) {
                  modal.callback({ 
                    name: modal.value, 
                    visibility: modal.currentVisibility 
                  });
                } else {
                  modal.callback(modal.value);
                }
                closeModal();
              }}
            >
              OK
            </button>
            <button 
              style={{ ...styles.button, background: '#bbb' }} 
              onClick={closeModal}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}
{/* Component Relationship Modal */}
{compRelModal && (
  <div style={styles.modalOverlay} onClick={closeCompRelModal}>
    <div style={styles.modal} onClick={e => e.stopPropagation()}>
      <span style={{ fontWeight: 'bold', fontSize: 18 }}>Add Component Relationship</span>
      <input
        style={styles.input}
        placeholder="First component name"
        value={compRelState.name1}
        onChange={e => setCompRelState(s => ({ ...s, name1: e.target.value }))}
        autoFocus
      />
      <input
        style={styles.input}
        placeholder="Second component name"
        value={compRelState.name2}
        onChange={e => setCompRelState(s => ({ ...s, name2: e.target.value }))}
      />
      <div style={{ fontSize: 15, marginBottom: 4 }}>Relationship:</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input 
          type="radio" 
          id="rel-provided" 
          name="rel-type" 
          value="provided" 
          checked={compRelState.relType === 'provided'} 
          onChange={() => setCompRelState(s => ({ ...s, relType: 'provided' }))} 
        />
        <label htmlFor="rel-provided">First provides, Second requires</label>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input 
          type="radio" 
          id="rel-required" 
          name="rel-type" 
          value="required" 
          checked={compRelState.relType === 'required'} 
          onChange={() => setCompRelState(s => ({ ...s, relType: 'required' }))} 
        />
        <label htmlFor="rel-required">First requires, Second provides</label>
      </div>
      <div style={{ marginTop: 10 }}>
        <button style={styles.button} onClick={handleCompRelOk}>OK</button>
        <button style={{ ...styles.button, background: '#bbb' }} onClick={closeCompRelModal}>
          Cancel
        </button>
      </div>
    </div>
  </div>
        )}
        {/* Java Import Modal */}
{showJavaImport && (
  <div style={styles.modalOverlay} onClick={() => setShowJavaImport(false)}>
    <div style={styles.modal} onClick={e => e.stopPropagation()}>
      <span style={{ fontWeight: 'bold', fontSize: 18 }}>Import Java Code</span>
      <textarea
        style={{ 
          ...styles.input, 
          height: '300px', 
          fontFamily: 'monospace',
          whiteSpace: 'pre',
          margin: '12px 0' 
        }}
        value={javaCodeInput}
        onChange={e => setJavaCodeInput(e.target.value)}
        placeholder="Paste Java classes here..."
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          style={styles.button}
          onClick={() => {
            try {
              const parsed = parseJavaCode(javaCodeInput);
              setClasses(prev => [...prev, ...parsed.classes]);
              setRelationships(prev => [...prev, ...parsed.relationships]);
              setShowJavaImport(false);
              setJavaCodeInput('');
            } catch (e) {
              alert('Error parsing Java code: ' + e.message);
            }
          }}
        >
          Import
        </button>
        <button 
          style={{ ...styles.button, background: '#bbb' }} 
          onClick={() => setShowJavaImport(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
        </div>
      </>
  );
});


export default UmlEditor;
import { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, Button } from './Modal';
import { useToast } from './Toast';
import { ZoomIn, ZoomOut, Move, RotateCcw, Crop, Droplet, AlertCircle } from 'lucide-react';
import { PROXY_IMAGE_URL } from '../../config/api';

export function ImageEditor({ isOpen, onClose, imageSrc, onSave }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const canvasRef = useRef(null);
    const renderCanvasRef = useRef(null);
    const toast = useToast();
    const [imageObj, setImageObj] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const CANVAS_SIZE = 200; // Output size for icons

    // Reset on new image
    useEffect(() => {
        if (isOpen && imageSrc) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setOpacity(1);
        }
    }, [isOpen, imageSrc]);

    // Load image object when src changes
    useEffect(() => {
        if (imageSrc) {
            // If it's already a data URL, load directly
            if (imageSrc.startsWith('data:')) {
                const img = new Image();
                img.onload = () => setImageObj(img);
                img.onerror = () => {
                    toast.error('Failed to load image');
                    setImageObj(null);
                };
                img.src = imageSrc;
                return;
            }
            
            // For external URLs, use the proxy to bypass CORS
            const loadViaProxy = async () => {
                try {
                    const proxyUrl = `${PROXY_IMAGE_URL}?url=${encodeURIComponent(imageSrc)}`;
                    const response = await fetch(proxyUrl);
                    
                    if (!response.ok) {
                        throw new Error('Proxy request failed');
                    }
                    
                    const data = await response.json();
                    
                    if (data.dataUrl) {
                        const img = new Image();
                        img.onload = () => setImageObj(img);
                        img.onerror = () => {
                            toast.error('Failed to load proxied image');
                            setImageObj(null);
                        };
                        img.src = data.dataUrl;
                    } else {
                        throw new Error('No data URL in response');
                    }
                } catch (err) {
                    console.error('Proxy load failed:', err);
                    // Fallback: try loading directly (will work for display but not save)
                    const img = new Image();
                    img.onload = () => {
                        setImageObj(img);
                        toast.error('Remote image restrictions: You can view but NOT edit/save this image.', 5000);
                    };
                    img.onerror = () => {
                        toast.error('Failed to load image');
                        setImageObj(null);
                    };
                    img.src = imageSrc;
                }
            };
            
            loadViaProxy();
        } else {
            setImageObj(null);
        }
    }, [imageSrc, toast]);

    // Handle mouse down for dragging
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // Handle mouse move
    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        requestAnimationFrame(() => {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        });
    }, [isDragging, dragStart]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Add/remove event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Zoom controls
    const zoomIn = () => setScale(s => Math.min(s + 0.1, 3));
    const zoomOut = () => setScale(s => Math.max(s - 0.1, 0.2));
    const resetTransform = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setOpacity(1);
    };

    // Process and save the image
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx || !imageSrc) return;

        try {
            // Let's use the hidden canvas to ensure we output exactly CANVAS_SIZE x CANVAS_SIZE
            canvas.width = CANVAS_SIZE;
            canvas.height = CANVAS_SIZE;
            ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            
            if (imageObj) {
                 const containerSize = 200;
                 const scaleRatio = CANVAS_SIZE / containerSize;
                 
                 // Helper to replicate the "contain" logic + user transform
                 const imgAspect = imageObj.naturalWidth / imageObj.naturalHeight;
                 let drawWidth, drawHeight;
                 
                 if (imgAspect > 1) {
                    drawHeight = containerSize * scale;
                    drawWidth = drawHeight * imgAspect;
                 } else {
                    drawWidth = containerSize * scale;
                    drawHeight = drawWidth / imgAspect;
                 }
                 
                 const offsetX = ((containerSize - drawWidth) / 2 + position.x) * scaleRatio;
                 const offsetY = ((containerSize - drawHeight) / 2 + position.y) * scaleRatio;
                 
                 ctx.globalAlpha = opacity;
                 ctx.drawImage(
                    imageObj, 
                    offsetX, 
                    offsetY, 
                    drawWidth * scaleRatio, 
                    drawHeight * scaleRatio
                 );
            }
            
            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl);
            onClose();
        } catch (err) {
             console.error('Failed to save image:', err);
             if (err.name === 'SecurityError') {
                toast.error('CORS Error: Cannot save this remote image.');
             } else {
                toast.error('Failed to save image.');
             }
        }
    };
    
    // Draw preview canvas
    useEffect(() => {
        const canvas = renderCanvasRef.current;
        if (!canvas || !isOpen) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Clear background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!imageObj) return;

        const containerSize = 200;
        canvas.width = containerSize;
        canvas.height = containerSize;

        const imgAspect = imageObj.naturalWidth / imageObj.naturalHeight;
        let drawWidth, drawHeight;

        if (imgAspect > 1) {
            drawHeight = containerSize * scale;
            drawWidth = drawHeight * imgAspect;
        } else {
            drawWidth = containerSize * scale;
            drawHeight = drawWidth / imgAspect;
        }

        const offsetX = (containerSize - drawWidth) / 2 + position.x;
        const offsetY = (containerSize - drawHeight) / 2 + position.y;

        ctx.globalAlpha = opacity;
        
        // Draw image
        try {
            ctx.drawImage(imageObj, offsetX, offsetY, drawWidth, drawHeight);
        } catch {
            // CORS might fail here if not handled, but we handle in load
        }
        
    }, [imageObj, scale, position, opacity, isOpen]);



    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Icon">
            <div className="flex flex-col gap-4">
                {/* Preview area */}
                <div className="flex justify-center">
                    <div 
                        className="relative w-[200px] h-[200px] rounded-xl overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjIyIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzIyMiIvPjwvc3ZnPg==')] cursor-move border-2 border-[var(--glass-border)]"
                        onMouseDown={handleMouseDown}
                    >
                        <canvas 
                            ref={renderCanvasRef}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            width={200}
                            height={200}
                        />
                        
                        {/* Crop overlay guides */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 border border-blue-400/30" />
                            <div className="absolute top-1/3 left-0 right-0 border-t border-blue-400/20" />
                            <div className="absolute top-2/3 left-0 right-0 border-t border-blue-400/20" />
                            <div className="absolute left-1/3 top-0 bottom-0 border-l border-blue-400/20" />
                            <div className="absolute left-2/3 top-0 bottom-0 border-l border-blue-400/20" />
                        </div>
                    </div>
                </div>
                
                {/* Hidden canvas for processing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Controls */}
                <div className="flex flex-col gap-3">
                    {/* Zoom controls */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-[var(--text-muted)] w-16">Zoom</label>
                        <button onClick={zoomOut} className="p-2 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--glass-bg-hover)] transition-colors text-[var(--text-primary)]">
                            <ZoomOut size={16} />
                        </button>
                        <input
                            type="range"
                            min="0.2"
                            max="3"
                            step="0.05"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <button onClick={zoomIn} className="p-2 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--glass-bg-hover)] transition-colors text-[var(--text-primary)]">
                            <ZoomIn size={16} />
                        </button>
                        <span className="text-xs text-[var(--text-muted)] w-12 text-right">{Math.round(scale * 100)}%</span>
                    </div>

                    {/* Opacity controls */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-[var(--text-muted)] w-16">Opacity</label>
                        <Droplet size={16} className="text-[var(--text-muted)]" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={opacity}
                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="text-xs text-[var(--text-muted)] w-12 text-right">{Math.round(opacity * 100)}%</span>
                    </div>

                    {/* Position hint */}
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Move size={14} />
                        <span>Drag image to reposition</span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-2 pt-4 border-t border-[var(--glass-border)]">
                    <Button variant="secondary" onClick={resetTransform} className="flex items-center gap-2">
                        <RotateCcw size={14} />
                        Reset
                    </Button>
                    <div className="flex-1" />
                    <Button variant="primary" onClick={handleSave}>
                        Apply
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

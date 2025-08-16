import socketio
import os
import bpy
import bmesh
import math

os.system("cls")
sio = socketio.Client()
Precision = 3

@sio.event
def connect():
    print("connected")

@sio.event
def disconnect():
    print("disconnected")
    
def setup():
    if sio and not sio.connected:
        sio.connect("http://localhost:5002")

#STACKOVERFLOW PIRATE

class SimpleOperator(bpy.types.Operator):
    bl_idname = "object.simple_operator"
    bl_label = "Simple Operator"
    # We set the option so it resets to default on each operator call
    callback: bpy.props.StringProperty(default="", options={"SKIP_SAVE"})

    def execute(self, context):
        if self.callback:
            exec(self.callback)        
        return {'FINISHED'}

class DesmosPanel(bpy.types.Panel):
    bl_label = "Desmos"
    bl_idname = "PT_DesmosPanel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Desmos'

    def draw(self, context):
        layout = self.layout
        connect = layout.operator(SimpleOperator.bl_idname, text="Connect to Socket (:5002)!")
        connect.callback = "setup()"
        #code here to gray out button if sio.connected is True
        
        send_wire = layout.operator(SimpleOperator.bl_idname, text="Send Selected Wireframe to Desmos!")
        send_wire.callback = "SendWireframeData()"
        
        send_tri = layout.operator(SimpleOperator.bl_idname, text="Send Selected Triangulated Mesh to Desmos!")
        send_tri.callback = "SendTriangleData()"

def REGISTER():
    bpy.utils.register_class(SimpleOperator)
    bpy.utils.register_class(DesmosPanel)

def UNREGISTER():
    bpy.utils.unregister_class(SimpleOperator)
    bpy.utils.unregister_class(DesmosPanel)

#STACKOVERFLOW PIRATE

def prepForDesmos(bm):
    #I want to tris->quads then quads->tris before uploading...
    bpy.ops.mesh.tris_convert_to_quads()
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    return bm
    

def SendWireframeData():
    os.system("cls")
    Vertices = []
    Faces = []
    try:
        bpy.context.selected_objects[0]
    except:
        print("Nothing selected!!")
        return
    
    Selected = bpy.context.selected_objects[0].data
    BMesh = bmesh.new()
    BMesh.from_mesh(Selected)

    for vertice in BMesh.verts:
        (x,y,z) = vertice.co
        Vertices.append("(" + str(round(x, Precision)) + "," + str(round(y, Precision)) + "," + str(round(z, Precision)) + ")")

    BMesh.faces.ensure_lookup_table()
    for face in BMesh.faces:
        indicies = []
        for vert in face.verts:
            indicies.append(vert.index + 1)
        indicies.append(indicies[0])
        Faces.append(indicies)
    

    print(str(Vertices))
    print("\n\n\n\n")
    print(str(Faces))
    
    if sio.connected:
        sio.emit("Blender", {"faces": Faces, "vertices": Vertices, "mode": "wireframe"})

def SendTriangleData():
    os.system("cls")
    Vertices = []
    Faces = []
    try:
        bpy.context.selected_objects[0]
    except:
        print("Nothing selected!!")
        return
    
    Selected = bpy.context.selected_objects[0].data
    BMesh = bmesh.new()
    BMesh.from_mesh(Selected)

    for vertice in BMesh.verts:
        (x,y,z) = vertice.co
        Vertices.append("(" + str(round(x, Precision)) + "," + str(round(y, Precision)) + "," + str(round(z, Precision)) + ")")

    BMesh.faces.ensure_lookup_table()
    for face in BMesh.faces:
        indicies = []
        for vert in face.verts:
            indicies.append(vert.index + 1)
        Faces.append(indicies)
    

    print(str(Vertices))
    print("\n\n\n\n")
    print(str(Faces))
    
    if sio.connected:
        sio.emit("Blender", {"faces": Faces, "vertices": Vertices, "mode": "triangles"})

# Test the panel
if __name__ == "__main__":
    REGISTER()
"""Generate the bounded p31m fundamental domains and one-piece dissection.
Requires Shapely 2 and NumPy. Authored outlines are read from the bundled data.
"""
import json,math,re
from pathlib import Path
import numpy as np
from shapely import Polygon,box,set_precision
from shapely.affinity import affine_transform,translate
from shapely.ops import unary_union,snap
ROOT=Path(__file__).resolve().parents[2]
p=next(p for p in json.loads((ROOT/'src/wallpaper/artin-patterns.json').read_text()) if p['group']=='p31m')
def polygon(path):
 return Polygon([(float(x),float(y)) for x,y in re.findall(r'[ML](-?[\d.]+) (-?[\d.]+)',path)])
full=polygon(p['cells'][0]['path']);A=set_precision(full.intersection(box(0,-2,2,3)),1e-7)
basis=np.array(p['lattice']).T;inv=np.linalg.inv(basis)
options=[]
for t in np.linspace(.025,.975,39):
 C=set_precision(A.intersection(box(t*A.bounds[2],-2,2,3)),1e-7);R=A.difference(C)
 if C.geom_type!='Polygon' or R.geom_type!='Polygon':continue
 for rep in p['representatives']:
  W=basis@np.array(rep[:4]).reshape(2,2)@inv
  if np.linalg.det(W)<0 or abs(np.trace(W)+1)>1e-5:continue
  for i in range(-1,2):
   for j in range(-1,2):
    shift=basis@(np.array(rep[4:])+[i,j]);m=[W[0,0],W[0,1],W[1,0],W[1,1],*shift]
    D=set_precision(snap(affine_transform(C,m),R,2e-6),1e-7);B=R.union(D)
    if B.geom_type=='Polygon' and B.is_valid and abs(B.area-A.area)<1e-6 and D.intersection(A).area<1e-6 and R.boundary.intersection(D.boundary).length>.005:
     options.append((abs(C.area/A.area-.25),A,C,R,D,B,m))
assert options,'No connected single-piece construction found'
_,A,C,R,D,B,m=min(options,key=lambda x:x[0])
world=np.array([[m[0],m[1]],[m[2],m[3]]]);angle=math.atan2(m[2],m[0]);center=np.linalg.solve(np.eye(2)-world,np.array(m[4:]))
def maps():
 for rep in p['representatives']:
  W=basis@np.array(rep[:4]).reshape(2,2)@inv
  for i in range(-3,4):
   for j in range(-3,4):
    shift=basis@(np.array(rep[4:])+[i,j]);yield [W[0,0],W[0,1],W[1,0],W[1,1],*shift]
cell=Polygon([(0,0),p['lattice'][0],np.sum(basis,axis=1),p['lattice'][1]])
for label,domain in [('red',A),('blue',B)]:
 pieces=[affine_transform(domain,g).intersection(cell) for g in maps()];union=unary_union(pieces)
 gap=cell.area-union.area;overlap=sum(x.area for x in pieces)-union.area
 assert gap<3e-6 and overlap<3e-6,(label,gap,overlap)
 assert abs(domain.area-cell.area/6)<1e-6
assert abs(R.union(D).symmetric_difference(B).area)<1e-9
assert R.intersection(D).area<1e-7
assert abs(C.area-D.area)<1e-6

def record(q):
 return {'path':'M'+'L'.join(f'{x:.7f} {y:.7f}' for x,y in list(q.exterior.coords)[:-1])+'Z','points':[list(x) for x in list(q.exterior.coords)[:-1]],'area':q.area}
result={k:record(q) for k,q in [('full',full),('red',A),('bite',C),('remainder',R),('destination',D),('blue',B)]}
result.update(lattice=p['lattice'],representatives=p['representatives'],move={'tool':'rotate','point':{'x':float(center[0]),'y':float(center[1])},'angle':angle,'affine':m},group='p31m',biteFraction=C.area/A.area)
(ROOT/'src/wallpaper/dissection.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
print('Verified connected domains, one connected bite, equal areas, group move, coverage and no interior overlap. Bite fraction:',C.area/A.area)

# Générique original « Sur le carreau » : 10 s, 120 bpm, calé sur l'intro (impact à 7,0 s).
import numpy as np
from scipy import signal
SR=44100;D=10.0;N=int(SR*D)
L=np.zeros(N);R=np.zeros(N)
rng=np.random.default_rng(3)
def t_(d):return np.arange(int(SR*d))/SR
def hz(m):return 440*2**((m-69)/12)
def add(x,start,pan=0.0,g=1.0):
    i=int(start*SR);x=x[:max(0,N-i)]
    L[i:i+len(x)]+=x*g*np.sqrt((1-pan)/2);R[i:i+len(x)]+=x*g*np.sqrt((1+pan)/2)
def saw(f,d,det=0.0):
    t=t_(d);return (signal.sawtooth(2*np.pi*f*t)+signal.sawtooth(2*np.pi*f*(1+det)*t+1.3))/2
def env(d,a=.005,r=.1,s=1.0):
    n=int(SR*d);e=np.ones(n)*s;na=max(1,int(a*SR));e[:na]=np.linspace(0,1,na)*s
    nr=min(n,int(r*SR));e[n-nr:]*=np.linspace(1,0,nr);return e
def lp(x,fc,order=2):
    b,a=signal.butter(order,min(fc,SR/2-100)/(SR/2));return signal.lfilter(b,a,x)
def hp(x,fc):
    b,a=signal.butter(2,fc/(SR/2),'high');return signal.lfilter(b,a,x)
# --- Kick
def kick(g=1.0):
    t=t_(.45);f=45+110*np.exp(-t*28);ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*7)*g
# --- Accords : Am (1-3 s), F (3-5 s), G (5-7 s), puis A (impact)
chords=[(1.0,[57,60,64,69]),(3.0,[53,57,60,65]),(5.0,[55,59,62,67])]
# Pad d'ouverture (0-1 s) et nappe sous la montée
for s,notes in [(0.0,[45,57,60,64])]+chords:
    d=2.0 if s>0 else 1.2
    for m in notes:
        x=lp(saw(hz(m),d,0.004),900+600*(s/7))*env(d,a=.6 if s==0 else .05,r=.4)
        add(x,s,pan=-.4,g=.05);add(x,s,pan=.4,g=.05)
# Basse pulsée en croches
for s,notes in chords:
    for k in range(16):
        st=s+k*.125;x=lp(saw(hz(notes[0]-12),.12),300+k*30,4)*env(.12,r=.05)
        add(x,st,g=.32 if k%2 else .4)
# Arpège en doubles croches, filtre qui s'ouvre de 700 Hz à 7 kHz
pattern=[0,1,2,3,2,1,3,2]
for s,notes in chords:
    for k in range(16):
        st=s+k*.125;m=notes[pattern[k%8]]+12;prog=(st-1)/6
        x=lp(saw(hz(m),.11,.006),700*10**prog,2)*env(.11,r=.06)
        add(x,st,pan=-.5 if k%2 else .5,g=.16)
# Kick sur chaque temps de 1 à 7 s, charleston sur les contretemps à partir de 3 s
for b in range(12):add(kick(),1.0+b*.5,g=.9)
hat=lambda g:hp(rng.standard_normal(int(.05*SR)),7000)*np.exp(-t_(.05)*80)*g
for b in range(8):add(hat(.25),3.25+b*.5,pan=.3)
# Roulement de caisse claire qui accélère (5-7 s)
def snare(g):
    t=t_(.14);return (hp(rng.standard_normal(len(t)),1500)*.8+np.sin(2*np.pi*190*t)*.5)*np.exp(-t*30)*g
tt=5.0
while tt<6.97:
    step=.25 if tt<6 else .125 if tt<6.5 else .0625
    add(snare(.12+.25*(tt-5)/2),tt,pan=-.15);tt+=step
# Montée de bruit (4,5-7 s) et note qui monte (5,5-7 s)
d=2.5;t=t_(d);nz=rng.standard_normal(len(t))
nz=np.concatenate([lp(nz[i:i+2205],400*20**(i/len(t))) for i in range(0,len(t),2205)])
add(nz*(t/d)**2*.35,4.5,pan=0)
d=1.5;t=t_(d);f=hz(45)*2**(2*t/d);x=signal.sawtooth(2*np.pi*np.cumsum(f)/SR)
add(lp(x,3000)*(t/d)**1.5*.12,5.5)
# Silence d'une croche avant l'impact (6,875-7 s) : on coupe le roulement
i0,i1=int(6.93*SR),int(7.0*SR);L[i0:i1]*=np.linspace(1,0,i1-i0);R[i0:i1]*=np.linspace(1,0,i1-i0)
# --- Impact à 7,0 s : kick + chute de sub, crash, accord de cuivres synthétiques en La majeur
add(kick(1.2),7.0)
t=t_(1.6);f=90*np.exp(-t*2.2)+28;add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*2.2)*.7,7.0)
t=t_(2.6);cr=hp(rng.standard_normal(len(t)),4000)*np.exp(-t*1.8)
add(cr*.22,7.0,pan=-.3);add(hp(rng.standard_normal(len(t)),4000)*np.exp(-t*1.8)*.22,7.0,pan=.3)
for m in [45,57,61,64,69,73,76]:
    x=lp(saw(hz(m),3.0,.005),2600)*env(3.0,a=.01,r=1.2)*np.exp(-t_(3.0)*.5)
    add(x,7.0,pan=-.35,g=.075);add(x,7.0,pan=.35,g=.075)
# Petit motif final, original (Mi-La-Do#-Si-La)
for k,(m,dur) in enumerate([(76,.25),(81,.25),(85,.25),(83,.25),(81,1.2)]):
    st=7.5+k*.25;x=lp(saw(hz(m),dur,.004),5000)*env(dur,a=.01,r=dur*.6)
    add(x,st,pan=0,g=.1)
# Nappe de fin (7-10 s)
for m in [57,61,64,69]:
    x=lp(saw(hz(m),3.0,.006),1200)*env(3.0,a=.4,r=1.5)
    add(x,7.0,pan=-.5,g=.04);add(x,7.0,pan=.5,g=.04)
# Réverbération légère
ir=rng.standard_normal(int(1.6*SR))*np.exp(-t_(1.6)*3.5);ir=lp(ir,5000);ir/=np.abs(ir).sum()**.5*40
L2=L+signal.fftconvolve(L,ir)[:N]*.9;R2=R+signal.fftconvolve(R,ir[::-1].copy()*0+ir)[:N]*.9
st=np.stack([L2,R2],1)
fade=np.ones(N);n=int(1.2*SR);fade[-n:]=np.linspace(1,0,n)**1.5;st*=fade[:,None]
st=np.tanh(st*1.4)/np.tanh(1.4);st/=np.abs(st).max()/0.89
from scipy.io import wavfile
wavfile.write('/home/claude/audio/generique.wav',SR,(st*32767).astype(np.int16))
print('ok',st.shape)
